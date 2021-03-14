<?php
    include_once 'common.php';
    $connection = connect_database();
    $username = $_POST['username'];
    $password = hash('sha512', $_POST['password']);
    $exists = '
        select * 
        from User
        where username = ? and
              password = ?
        limit 1';
    safe_query($connection, $exists, $username, $password)->num_rows == 1 or die('not_found');
    if (!session_start()) {
        die('session_failure');
    }
    $_SESSION = [
        'username' => $username
    ];
    $connection->close();
