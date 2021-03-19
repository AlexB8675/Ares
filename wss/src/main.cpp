#include <boost/beast/websocket.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <boost/beast/core.hpp>

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
#include <queue>
#include <regex>
#include <set>

namespace beast     = boost::beast;
namespace asio      = boost::asio;
namespace websocket = beast::websocket;
namespace http      = beast::http;
namespace ip        = asio::ip;
namespace rjs       = rapidjson;

using payload_data_t = std::vector<unsigned char>;

static std::string timestamp() noexcept {
    const auto time = std::time(nullptr);
    return (std::stringstream() << std::put_time(std::localtime(&time), "[%Y-%m-%d %H:%M:%S]: ")).str();
}

class websocket_session_t;

class shared_state_t {
    std::set<websocket_session_t*> _sessions;
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
    void send(const payload_data_t& data, Args&&... args) noexcept {
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
    websocket::stream<beast::tcp_stream> _ws;
    std::shared_ptr<shared_state_t> _state;
    std::queue<payload_data_t> _payloads;
    ip::tcp::endpoint _endpoint;
    beast::flat_buffer _buffer;

    void on_send(const payload_data_t& payload) noexcept {
        _payloads.push(payload);
        if (_payloads.size() > 1) {
            return;
        }

        _ws.async_write(
            asio::buffer(_payloads.front()),
            [self = shared_from_this()](beast::error_code, std::size_t) noexcept {
                self->on_write();
            });
    }

    void on_write() noexcept {
        _payloads.pop();
        if (!_payloads.empty()) {
            _ws.async_write(
                asio::buffer(_payloads.front()),
                [self = shared_from_this()](beast::error_code, std::size_t) noexcept {
                    self->on_write();
                });
        }
    }

    void on_read(beast::error_code error) noexcept {
        if (error == websocket::error::closed) {
            return;
        }

        if (_buffer.size() > 0) {
            std::string payload(asio::buffer_cast<const char*>(_buffer.cdata()), _buffer.size());
            _buffer.consume(_buffer.size());
            std::cout << timestamp() << payload << '\n';
            rjs::Document document;
            document.Parse(payload.c_str());
            const std::string type   = document["type"].Get<const char*>();
            const std::string author = document["payload"]["id"].Get<const char*>();
            const std::string id     = document["payload"]["author"].Get<const char*>();
            std::string content      = document["payload"]["content"].Get<const char*>();
            content = std::regex_replace(content, std::regex("\""), "\\\"");
            if (type == "message_create") {
                const auto response =
                    "{\n"
                    "  \"op\": 1,\n"
                    "  \"type\": \"message_create\",\n"
                    "  \"payload\": {\n"
                    "    \"id\": " + id + ",\n"
                    "    \"content\": \"" + content + "\",\n"
                    "    \"author\": \"" + author + "\"\n"
                    "  }\n"
                    "}";
                _state->send({ response.begin(), response.end() }, this);
            }
        }
        _ws.async_read(
            _buffer,
            beast::bind_front_handler([self = shared_from_this()](beast::error_code error, std::size_t) noexcept {
                self->on_read(error);
            }));
    }

    void on_accept(beast::error_code error) noexcept {
        std::cout << timestamp() << "connection approved: " << _endpoint.address().to_string() << '\n';
        if (!error) {
            _state->insert(this);
            _ws.async_read(
                _buffer,
                beast::bind_front_handler([self = shared_from_this()](beast::error_code error, std::size_t) noexcept {
                    self->on_read(error);
                }));
        }
    }

    void on_run() noexcept {
        using namespace std::chrono_literals;
        _ws.set_option(websocket::stream_base::timeout::suggested(beast::role_type::server));
        _ws.async_accept(
            beast::bind_front_handler([self = shared_from_this()](beast::error_code error) noexcept {
                self->on_accept(error);
            }));
    }
public:
    websocket_session_t(ip::tcp::socket&&               socket,
                        ip::tcp::endpoint&&             endpoint,
                        std::shared_ptr<shared_state_t> state) noexcept
        : _ws(std::move(socket)),
          _state(std::move(state)),
          _endpoint(std::move(endpoint)) {}

    ~websocket_session_t() noexcept {
        std::cout << timestamp() << "connection terminated: " << _endpoint.address().to_string() << '\n';
        _state->erase(this);
    }

    void run() noexcept {
        asio::dispatch(
            _ws.get_executor(),
            [self = shared_from_this()]() {
                self->on_run();
            });
    }

    void send(const payload_data_t& payload) noexcept {
        asio::post(
            _ws.get_executor(),
            [payload, self = shared_from_this()]() noexcept {
                self->on_send(payload);
            });
    }
};

class listener_t : public std::enable_shared_from_this<listener_t> {
    std::shared_ptr<shared_state_t> _state;
    ip::tcp::acceptor _acceptor;
    asio::io_context& _context;

    void accept(ip::tcp::socket&& sock) noexcept {
        auto endpoint = sock.remote_endpoint();
        std::make_shared<websocket_session_t>(std::move(sock), std::move(endpoint), _state)->run();
        _acceptor.async_accept(
            asio::make_strand(_context),
            [self = shared_from_this()](beast::error_code, ip::tcp::socket sock) noexcept {
                self->accept(std::move(sock));
            });
    }

public:
    listener_t(asio::io_context& context, const ip::tcp::endpoint& endpoint) noexcept
        : _state(new shared_state_t()),
          _acceptor(context),
          _context(context) {
        _acceptor.open(endpoint.protocol());
        _acceptor.set_option(asio::socket_base::reuse_address(true));
        _acceptor.bind(endpoint);
        _acceptor.listen();
    }

    void run() noexcept {
        _acceptor.async_accept(
            asio::make_strand(_context),
            [self = shared_from_this()](beast::error_code, ip::tcp::socket sock) noexcept {
                self->accept(std::move(sock));
            });
    }
};

int main() {
    const auto concurrency = std::thread::hardware_concurrency();
    const auto address     = asio::ip::make_address("0.0.0.0");
    const auto port        = 9000u;
    auto context           = asio::io_context(concurrency);
    auto threads           = std::vector<std::thread>(concurrency - 1);

    std::make_shared<listener_t>(context, ip::tcp::endpoint{ address, port })->run();
    for (auto& each : threads) {
        each = std::thread([&context]() noexcept {
            context.run();
        });
    }
    context.run();
    return 0;
}
