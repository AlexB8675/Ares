<?php
    function connect_database(): mysqli {
        $database   = 'Ares';
        $hostname   = 'localhost';
        $username   = 'root';
        $password   = '';
        $connection = mysqli_connect($hostname, $username, $password);
        if ($connection->connect_error) {
            die("{ \"message\": \"connection_error: $connection->connect_error\", \"code\": 500 }");
        }
        if (!mysqli_select_db($connection, $database)) {
            die('{ "message": "unknown_database", "code": 500 }');
        }
        return $connection;
    }

    function safe_query(mysqli $connection, string $query, mixed... $args): mysqli_stmt|false {
        $statement = mysqli_prepare($connection, $query);
        $params    = [...$args];
        $types     = '';

        if (substr_count($query, '?') != count($params)) {
            die('{ "message": "argument_mismatch", "code": 500 }');
        }
        foreach ($params as $arg) {
            $type   = gettype($arg);
            $types .= match ($type) {
                'string', 'double', 'integer' => $type[0],
                default                       => die('{ "message": "type_error", "code": 500 }')
            };
        }
        if (strlen($types) > 0) {
            $statement->bind_param($types, ...$args);
        }
        if (!$statement->execute()) {
            return false;
        }
        return $statement;
    }

    function start_session() {
        if (!session_start() || count($_SESSION) === 0) {
            die('{ "message": "unauthorized", "code": 401 }');
        }
    }

    function check_authorization() {
        $header = apache_request_headers();
        if (isset($header['Authorization'])) {
            start_session();
            if ($_SESSION['token'] == substr($header['Authorization'], 5)) {
                return;
            }
        }
        die('{ "message": "unauthorized", "code": 401 }');
    }
