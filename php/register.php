<?php
    include_once 'common.php';
    $connection = connect_database();
    $username   = $_POST['username'];
    $email      = $_POST['email'];
    $password   = hash('sha512', $_POST['password']);
    $query      = 'insert into User value (default, ?, ?, ?)';
    if (!safe_query($connection, $query, $username, $email, $password)) {
        $query = "select username from User where username = ?";
        if (safe_query($connection, $query, $username)->num_rows != 0) {
            die('duplicate_username');
        }
        $query = "select email from User where email = ?";
        if (safe_query($connection, $query, $username)->num_rows != 0) {
            die('duplicate_email'); 
        }
        die('unknown_error');
    }
    $connection->close();