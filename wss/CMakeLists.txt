cmake_minimum_required(VERSION 3.17)
project(wss_chat CXX)

set(CMAKE_CXX_STANDARD 20)

set(Boost_USE_STATIC_LIBS ON)
set(Boost_MULTITHREADED ON)
set(Boost_USE_STATIC_RUNTIME OFF)

find_package(Boost REQUIRED)
find_package(OpenSSL REQUIRED)

add_subdirectory(ext/rapidjson)

add_executable(wss_chat src/main.cpp)
target_compile_options(wss_chat PUBLIC /EHsc /bigobj)
target_include_directories(wss_chat PUBLIC ext/rapidjson/include ${Boost_INCLUDE_DIRS})
target_link_libraries(wss_chat PUBLIC OpenSSL::SSL)
target_link_directories(wss_chat PUBLIC ${Boost_LIBRARY_DIRS})