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
    const auto time = std::time(nullptr);
    return (std::stringstream() << std::put_time(std::localtime(&time), "[%Y-%m-%d %H:%M:%S]: ")).str();
}

static std::chrono::milliseconds time_since_epoch() noexcept {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::high_resolution_clock::now().time_since_epoch());
}

static ssl::context make_ssl_context() noexcept {
    ssl::context context{ ssl::context_base::tlsv12_server };
    constexpr const char cert[] =
        "-----BEGIN CERTIFICATE-----\n"
        "MIIEFTCCAv2gAwIBAgIURcZvTgTX26V2YXX79X69Bhs8Z0IwDQYJKoZIhvcNAQEL\n"
        "BQAwgagxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQH\n"
        "Ew1TYW4gRnJhbmNpc2NvMRkwFwYDVQQKExBDbG91ZGZsYXJlLCBJbmMuMRswGQYD\n"
        "VQQLExJ3d3cuY2xvdWRmbGFyZS5jb20xNDAyBgNVBAMTK01hbmFnZWQgQ0EgYjc0\n"
        "NjJiMGJiMTQ4MTk2ZGIwZTA3ODZhZTJjOWM5OTkwHhcNMjEwMzMwMjEwNzAwWhcN\n"
        "MzEwMzI4MjEwNzAwWjAiMQswCQYDVQQGEwJVUzETMBEGA1UEAxMKQ2xvdWRmbGFy\n"
        "ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAIyrlljVxZDmEujcTY4h\n"
        "QoccYZaejF2xuQOp6s7k4WY5tHi6+cox6QP0tY3tHG417cDay4eN4tUQXEaFkwOg\n"
        "4nAjtQRDXKpCCT7bAcv23v/NEvazAgP/i+lPhYMt091/okTVTK4Z1g9i2gh+kWcU\n"
        "SKUbM9guR+WRucWeMqecHm0XMlcPuDg9YQoXxwiJ5cmonGTg8oC+hDlVmrg7dKyX\n"
        "8sdqNqFzpci70djtH9pZSuoPmpRBwuh6kwh0LESTqFKdoPFX9ejJVEyjByKralVH\n"
        "wJB8Dj+zmQf4T4PCvJBhhPvSZ5Uc4S9AvInQvtOOTO1NJ4Z2FOgTrL0AJLSB8l9t\n"
        "qkUCAwEAAaOBuzCBuDATBgNVHSUEDDAKBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAA\n"
        "MB0GA1UdDgQWBBSpIT/3r8ad7GSjESH7QXQOodNuhjAfBgNVHSMEGDAWgBRiTvNC\n"
        "GnL+sHeRoChmBXH/lq79BTBTBgNVHR8ETDBKMEigRqBEhkJodHRwOi8vY3JsLmNs\n"
        "b3VkZmxhcmUuY29tL2VjNWQ1MTdmLTk0OWEtNDQxMy04ZWU3LWJhZjdiMjdiMDgz\n"
        "NC5jcmwwDQYJKoZIhvcNAQELBQADggEBAIkFWjbjp6hCuRqLdYf4afQCjHqOIkQN\n"
        "oToDppEQ8rMBzWEmq2avNpunnodphTjsmPUmTzIg7f/s0u4OUb62lmH+Chr1qW5V\n"
        "23kWNnvZ0F9AE/rRgdpqr7HqzjVpg8+GoYsmWcPosElJPGv+qijezAW99GyMiLOM\n"
        "ZYLUDlSIDoG9yFsxWld1bYKDYgcfBikkAETm/ZkrP5Vr8WAhnZIE9s9BpVW16dS7\n"
        "C1mvoKToNQahx/avMNX5sTdMC5M+TxdnXgALtm7JUE+gmPBSzd5ycVX0wl+b0OIU\n"
        "l+sF/qroM+P8dEfxRKmO9VwH31fN2mXwpQmWUFamTSiMEfLJlRboPpM=\n"
        "-----END CERTIFICATE-----";

    constexpr const char key[] =
        "-----BEGIN PRIVATE KEY-----\n"
        "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCMq5ZY1cWQ5hLo\n"
        "3E2OIUKHHGGWnoxdsbkDqerO5OFmObR4uvnKMekD9LWN7RxuNe3A2suHjeLVEFxG\n"
        "hZMDoOJwI7UEQ1yqQgk+2wHL9t7/zRL2swID/4vpT4WDLdPdf6JE1UyuGdYPYtoI\n"
        "fpFnFEilGzPYLkflkbnFnjKnnB5tFzJXD7g4PWEKF8cIieXJqJxk4PKAvoQ5VZq4\n"
        "O3Ssl/LHajahc6XIu9HY7R/aWUrqD5qUQcLoepMIdCxEk6hSnaDxV/XoyVRMowci\n"
        "q2pVR8CQfA4/s5kH+E+DwryQYYT70meVHOEvQLyJ0L7TjkztTSeGdhToE6y9ACS0\n"
        "gfJfbapFAgMBAAECggEAEeSBaytFxfh9z0C2XK2+WJEzmITyNbi1X9HtHAPg56/P\n"
        "VMvzmdRfXzFxJmxSgXI6m5045jUV9SPvmMjEumFsa/cevzwSPVXI90XEJL1x//eF\n"
        "wfti9j86/KIwyU669CGX8klvR3Xh1HMuaIYw2HusAdRD8+tvGbQ/fPNyXf9tn1Jz\n"
        "vd1TXGXzYZYOqmtYu704Co+tenZpf4tNfATTZ/B67Z2StQDmmrtMLh+oEzdCzWwf\n"
        "savf2I3oGKHsMmheQMJyTSzsHArFZYPldHLuhioCS8VQohRGmQ0SscUkeF8dh6o9\n"
        "KxIgYIzi3Nx9I3iP6ecqgk3lQoYfn+kfD+N0AXMsAQKBgQC/FJhvNq09T2Orqnwk\n"
        "4/E6NRyhXBtOldvIzUiuMX9vr5qZV1Pzp4AQRN9Lwbq2yBjhr/4qzMzjSAYzPfnO\n"
        "UmKpztGtv/m21Ui5MqtB6hBty9GtN0zowJmHSAt8lt9+3RZDSk24fV7GzyY32dcZ\n"
        "m7+iHoRCg15mTzAX96NW/CVsFQKBgQC8doSDq8ermvdqdlB7Zcd7f583xa9fOLPk\n"
        "XV1rL8xDRjq4ugsxhuMZPjGB80vYScwP7jo2MOBG4/3LMjErxzX1LldROFLDyKIy\n"
        "qAEMn4eloYuImyr3m8WbjgYq7CGJGw6K0vA4VhT08D6cmL35wN/vP+LZQnRZaCOc\n"
        "6/aQbWFhcQKBgAwIYP0H5Wrp9+3Ug5LTI9q1g4MJyNJvD3Maskv94/eFiGfFnwzF\n"
        "7IOZwrIDlh1yhlaX/Zp2YSSi4XkSmwuKFpp44q1dXH1N+xFmhnBVLAmt/xs4U0iI\n"
        "8GIbgFWtLo/PnlpIcJKAmppMayyzNB9xtmSgJVYG7cfljrLDrm6I3FZtAoGBAI09\n"
        "GQSAyWwPABsWPiysUzp3o4Ats8dd/FtJqUg6Ew/b4wgrzVW5rBpv5LRp/E5EyBys\n"
        "QY35RSt7k+kjXXxcmFB+AUxKNKSriPsDs32dVRBJKAQhnarhX8+7OV4ThvJ0h4p8\n"
        "mTDvOldycMn1InK5HFn1+/Esf3u9surYX/lPL+rRAoGBAKpvA2vP/eipAdLZFa86\n"
        "9TvutQuWE3MqYrXzLRIeTh0gQJxEJRzuidraxj7TXaRRgwH8EQFI+8PxgT8jAu5U\n"
        "GIlEAFZOQHnwlKc3E40y83hJpO5+6Yrjc0RCV5W+apeU2PeeyLq3IhUMLDgmsf/5\n"
        "Yi8kGv4XfXFXLp9q4IDTi+T9\n"
        "-----END PRIVATE KEY-----";

    context.set_options(
        ssl::context::default_workarounds |
        ssl::context::no_sslv2);

    context.use_certificate_chain(
        asio::buffer(cert, sizeof cert));

    context.use_private_key(
        asio::buffer(key, sizeof key),
        ssl::context::file_format::pem);
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
        if (error == websocket::error::closed) {
            return;
        }

        if (_buffer.size() > 0) {
            rjs::Document document;
            rjs::StringBuffer buffer;
            document.Parse(static_cast<const char*>(_buffer.cdata().data()), _buffer.size());
            rjs::Writer<rjs::StringBuffer> writer(buffer);
            document.Accept(writer);
            std::cout << timestamp() << "received payload: " << buffer.GetString() << '\n';
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
                using namespace std::chrono_literals;
                constexpr auto time_delta = 1000ms;
                constexpr auto interval   = 60000ms;
                const auto current = time_since_epoch();
                if ((current - _heartbeat - interval) < time_delta) {
                    constexpr std::string_view response = R"({ "op": 11 })";
                    send({ response.begin(), response.end() });
                    std::cout << timestamp() << "heartbeat accepted, acking: " << _address << '\n';
                    _heartbeat = current;
                } else {
                    std::cout << timestamp() << "heartbeat failure, disconnecting: " << _address << '\n';
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
        std::cout << timestamp() << "handshake approved\n";
        if (!error) {
            std::cout << timestamp() << "connection accepted\n";
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
