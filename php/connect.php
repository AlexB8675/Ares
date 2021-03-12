<?php
    function connect_database(): mysqli {
        $connection = new mysqli("localhost", "root", "");
        if ($connection->connect_error) {
            die("connection_error: $connection->connect_error");
        }
        $connection->select_db("Phobos");
        return $connection;
    }
