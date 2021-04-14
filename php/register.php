<?php
    include_once 'common.php';
    $connection = connect_database();
    $id         = intval($_POST['id']);
    $username   = $_POST['username'];
    $email      = $_POST['email'];
    $password   = hash('sha512', $_POST['password']);

    $query = "select username from User where username = ?";
    if (safe_query($connection, $query, $username)
            ->get_result()
            ->num_rows != 0) {
        die('{ "message": "duplicate_username", "code": 400 }');
    }
    $query = "select email from User where email = ?";
    if (safe_query($connection, $query, $email)
            ->get_result()
            ->num_rows != 0) {
        die('{ "message": "duplicate_email", "code": 400 }');
    }

    $query = 'insert into User (id, username, email, password) value (?, ?, ?, ?)';
    safe_query($connection, $query, $id, $username, $email, $password);
    mysqli_close($connection);
    print '{}';
