<?php
    function connect_database(): mysqli {
        $connection = mysqli_connect('localhost', 'root', '');
        if ($connection->connect_error) {
            die("connection_error: $connection->connect_error");
        }
        $connection->select_db('Phobos');
        return $connection;
    }

    function safe_query(mysqli $connection, string $query, &...$args): mysqli_stmt|false {
        $statement = $connection->prepare($query);
        $types = '';
        foreach ([...$args] as $arg) {
            $types .= match (gettype($arg)) {
                'string'  => 's',
                'double'  => 'd',
                'integer' => 'i',
                default   => die('query_error')
            };
        }
        if (substr_count($query, '?') != strlen($types)) {
            die('arguments_mismatch');
        }
        if (strlen($types) > 0) {
            $statement->bind_param($types, ...$args);
        }
        if (!$statement->execute()) {
            return false;
        }
        return $statement;
    }