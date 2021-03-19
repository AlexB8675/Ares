<?php
    include_once 'common.php';
    $connection = connect_database();
    $id         = $_POST['id'];
    $username   = $_POST['username'];
    $email      = $_POST['email'];
    $password   = hash('sha512', $_POST['password']);

    $query = "select username from User where username = ?";
    if (safe_query($connection, $query, $username)
            ->get_result()
            ->num_rows != 0) {
        die('duplicate_username');
    }
    $query = "select email from User where email = ?";
    if (safe_query($connection, $query, $email)
            ->get_result()
            ->num_rows != 0) {
        die('duplicate_email');
    }

    $query = 'insert into User (id, username, email, password) value (?, ?, ?, ?)';
    safe_query($connection, $query, intval($id), $username, $email, $password);
    mysqli_close($connection);
