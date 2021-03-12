<?php
    include_once 'connect.php';
    $connection = connect_database();
    $username   = hash('sha512', $_POST['username']);
    $email      = hash('sha512', $_POST['email']);
    $password   = hash('sha512', $_POST['password']);
    if (!$connection->query(
        "insert into User value (default, '$username', '$email', '$password')"
    )) {
        if ($connection->query("select username from User where username = '$username'")->num_rows != 0) {
            die('duplicate_username');
        }
        if ($connection->query("select email from User where email = '$email'")->num_rows != 0) {
            die('duplicate_email');
        }
        die('unknown_error');
    }
    $connection->close();