#include <boost/beast/websocket/ssl.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/ssl.hpp>

#include <rapidjson/document.h>
#include <rapidjson/reader.h>
#include <rapidjson/writer.h>

#include <functional>
#include <algorithm>
#include <optional>
#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <utility>
#include <chrono>
#include <memory>
#include <string>
#include <thread>
#include <vector>
#include <cmath>
#include <queue>
#include <regex>
#include <set>

namespace beast     = boost::beast;
namespace asio      = boost::asio;
namespace websocket = beast::websocket;
namespace http      = beast::http;
namespace ssl       = asio::ssl;
namespace ip        = asio::ip;
namespace rjs       = rapidjson;

using payload_data_t = std::vector<char8_t>;

static std::string timestamp() noexcept {
    const auto clock = std::chrono::system_clock::now();
    const auto milli = std::chrono::duration_cast<std::chrono::milliseconds>(clock.time_since_epoch()) % 1000;
    const auto time  = std::chrono::system_clock::to_time_t(clock);
    return (std::stringstream() << std::put_time(std::localtime(&time), "[%Y-%m-%d %H:%M:%S.") << std::setw(3) << std::setfill('0') << milli.count() << "]: ").str();
}

static std::chrono::milliseconds time_since_epoch() noexcept {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::high_resolution_clock::now().time_since_epoch());
}

static ssl::context make_ssl_context() noexcept {
    ssl::context context{ ssl::context::tlsv13_server };
    context.set_options(ssl::context::default_workarounds | ssl::context::no_sslv2);
    context.use_certificate_chain_file("../cert.pem");
    context.use_private_key_file("../cert.key", ssl::context::file_format::pem);
    return context;
}

class websocket_session_t;
class shared_state_t {
    std::set<websocket_session_t*> _sessions; // TODO: Split sessions for server | channel
    std::mutex _lock;
public:
    void insert(websocket_session_t* session) noexcept {
        std::lock_guard<std::mutex> guard(_lock);
        _sessions.insert(session);
    }

    void erase(websocket_session_t* session) noexcept {
        std::lock_guard<std::mutex> guard(_lock);
        _sessions.erase(session);
    }

    template <typename... Args>
    void broadcast(const payload_data_t& data, Args&&... args) noexcept {
        const auto excluded = std::set<websocket_session_t*>{ args... };

        std::vector<std::weak_ptr<websocket_session_t>> session_refs; {
            std::lock_guard<std::mutex> guard(_lock);
            session_refs.reserve(_sessions.size() - excluded.size());
            for (auto session : _sessions) {
                if (!excluded.contains(session)) {
                    session_refs.emplace_back(session->weak_from_this());
                }
            }
        }

        for (const auto& each : session_refs) {
            if (auto session = each.lock()) {
                session->send(data);
            }
        }
    }
};

class websocket_session_t : public std::enable_shared_from_this<websocket_session_t> {
    websocket::stream<beast::ssl_stream<beast::tcp_stream>> _wss;
    std::shared_ptr<shared_state_t> _state;
    std::queue<payload_data_t> _payloads;
    std::chrono::milliseconds _heartbeat;
    beast::flat_buffer _buffer;
    std::string _address;

    void on_send(const payload_data_t& payload) noexcept {
        _payloads.push(payload);
        if (_payloads.size() > 1) {
            return;
        }

        _wss.async_write(
            asio::buffer(_payloads.front()),
            [self = shared_from_this()](beast::error_code, std::size_t) noexcept {
                self->on_write();
            });
    }

    void on_write() noexcept {
        _payloads.pop();
        if (!_payloads.empty()) {
            _wss.async_write(
                asio::buffer(_payloads.front()),
                [self = shared_from_this()](beast::error_code, std::size_t) noexcept {
                    self->on_write();
                });
        }
    }

    void on_read(beast::error_code error) noexcept {
        using namespace std::chrono_literals;
        constexpr auto time_delta = 5000ms;
        constexpr auto interval   = 60000ms;
        if (error == websocket::error::closed) {
            return;
        }

        if (time_since_epoch() - _heartbeat > interval + time_delta) {
            std::printf("%s0x%08llx | %s: heartbeat error\n", timestamp().c_str(), (std::uintptr_t)this, _address.c_str());
            return;
        }

        if (_buffer.size() > 0) {
            rjs::Document document;
            rjs::StringBuffer buffer;
            document.Parse(static_cast<const char*>(_buffer.cdata().data()), _buffer.size());
            rjs::Writer<rjs::StringBuffer> writer(buffer);
            document.Accept(writer);
            std::printf("%s0x%08llx | %s: received payload: %s\n", timestamp().c_str(), (std::uintptr_t)this, _address.c_str(), buffer.GetString());
            _buffer.consume(_buffer.size());
            const std::string type = document["type"].Get<const char*>();
            if (type == "message_create") {
                const std::string id      = document["payload"]["id"].Get<const char*>();
                const std::string author  = document["payload"]["author"].Get<const char*>();
                const std::string content = std::regex_replace(document["payload"]["content"].Get<const char*>(), std::regex("\""), "\\\"");
                const auto response =
                    "{\n"
                    "  \"op\": 1,\n"
                    "  \"type\": \"message_create\",\n"
                    "  \"payload\": {\n"
                    "    \"id\": \"" + id + "\",\n"
                    "    \"author\": \"" + author + "\",\n"
                    "    \"content\": \"" + content + "\"\n"
                    "  }\n"
                    "}";
                _state->broadcast({ response.begin(), response.end() }, this);
            } else if (type == "heartbeat") {
                const auto current = time_since_epoch();
                const auto elapsed = current - _heartbeat - interval;
                if (-time_delta < elapsed && elapsed < time_delta) {
                    constexpr std::string_view response = R"({ "op": 11, "type": "heartbeat" })";
                    send({ response.begin(), response.end() });
                    _heartbeat = current;
                } else {
                    std::printf("%s0x%08llx | %s: heartbeat error\n", timestamp().c_str(), (std::uintptr_t)this, _address.c_str());
                    return;
                }
            }
        }
        _wss.async_read(
            _buffer,
            beast::bind_front_handler([self = shared_from_this()](beast::error_code error, std::size_t) noexcept {
                self->on_read(error);
            }));
    }

    void on_accept(beast::error_code error) noexcept {
        std::cout << timestamp() << "handshake accepted\n";
        if (!error) {
            std::cout << timestamp() << "connection approved\n";
            _heartbeat = time_since_epoch();
            _state->insert(this);
            _wss.async_read(
                _buffer,
                beast::bind_front_handler([self = shared_from_this()](beast::error_code error, std::size_t) noexcept {
                    self->on_read(error);
                }));
        } else {
            std::cout << timestamp() << "connection denied\n";
        }
    }

    void on_handshake(beast::error_code error) noexcept {
        std::cout << timestamp() << "handshake request from: " << _address << '\n';
        if (!error) {
            beast::get_lowest_layer(_wss).expires_never();
            _wss.set_option(websocket::stream_base::timeout::suggested(beast::role_type::server));
            _wss.async_accept(
                beast::bind_front_handler([self = shared_from_this()](beast::error_code error) noexcept {
                    self->on_accept(error);
                }));
        } else {
            std::cout << timestamp() << "handshake error, connection denied\n";
        }
    }

    void on_run() noexcept {
        using namespace std::chrono_literals;
        beast::get_lowest_layer(_wss).expires_after(30s);
        _wss.next_layer()
            .async_handshake(
                ssl::stream_base::server,
                [self = shared_from_this()](beast::error_code error) noexcept {
                    self->on_handshake(error);
                });
    }
public:
    websocket_session_t(ip::tcp::socket&& socket, ip::tcp::endpoint&& endpoint, ssl::context& ssl, std::shared_ptr<shared_state_t> state) noexcept
        : _wss(std::move(socket), ssl),
          _state(std::move(state)),
          _heartbeat(),
          _address(endpoint.address().to_string()) {}

    ~websocket_session_t() noexcept {
        std::cout << timestamp() << "connection terminated: " << _address << '\n';
        _state->erase(this);
    }

    void run() noexcept {
        asio::dispatch(
            _wss.get_executor(),
            [self = shared_from_this()]() noexcept {
                self->on_run();
            });
    }

    void send(const payload_data_t& payload) noexcept {
        asio::post(
            _wss.get_executor(),
            [payload, self = shared_from_this()]() noexcept {
                self->on_send(payload);
            });
    }
};

class listener_t : public std::enable_shared_from_this<listener_t> {
    std::shared_ptr<shared_state_t> _state;
    ip::tcp::acceptor _acceptor;
    asio::io_context& _context;
    ssl::context& _ssl;

    void accept(ip::tcp::socket&& socket) noexcept {
        auto endpoint = socket.remote_endpoint();
        std::cout << timestamp() << "connection request from: " << endpoint.address().to_string() << '\n';
        std::make_shared<websocket_session_t>(std::move(socket), std::move(endpoint), _ssl, _state)->run();
        _acceptor.async_accept(
            asio::make_strand(_context),
            [self = shared_from_this()](beast::error_code, ip::tcp::socket socket) noexcept {
                self->accept(std::move(socket));
            });
    }

public:
    listener_t(asio::io_context& context, ssl::context& ssl, const ip::tcp::endpoint& endpoint) noexcept
        : _state(new shared_state_t()),
          _acceptor(context),
          _context(context),
          _ssl(ssl) {
        _acceptor.open(endpoint.protocol());
        _acceptor.set_option(asio::socket_base::reuse_address(true));
        _acceptor.bind(endpoint);
        _acceptor.listen();
    }

    void run() noexcept {
        _acceptor.async_accept(
            asio::make_strand(_context),
            [self = shared_from_this()](beast::error_code, ip::tcp::socket socket) noexcept {
                self->accept(std::move(socket));
            });
    }
};

int main() {
    const auto concurrency = std::thread::hardware_concurrency();
    const auto address     = asio::ip::make_address("0.0.0.0");
    const auto port        = 2096u;
    auto context           = asio::io_context(concurrency);
    auto ssl               = make_ssl_context();
    auto threads           = std::vector<std::thread>(concurrency - 1);

    std::make_shared<listener_t>(context, ssl, ip::tcp::endpoint{ address, port })->run();
    std::cout << timestamp() << "started listening on port: " << port << '\n';
    for (auto& each : threads) {
        each = std::thread([&context]() noexcept {
            context.run();
        });
    }
    context.run();
    return 0;
}
