<?php
    function connect_database(): mysqli {
        $connection = mysqli_connect("localhost", "root", "");
        if ($connection->connect_error) {
            die("connection_error: $connection->connect_error");
        }
        $connection->select_db("Phobos");
        return $connection;
    }
