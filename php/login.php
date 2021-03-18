<?php
    include_once 'common.php';
    $connection = connect_database();
    $username = $_POST['username'];
    $password = hash('sha512', $_POST['password']);
    $exists = '
        select * 
        from User
        where username = ? and
              password = ?';
    $found = safe_query($connection, $exists, $username, $password)->get_result();
    if ($found->num_rows === 0) {
        die('not_found');
    }
    if (!session_start()) {
        die('session_failure');
    }

    $found = $found->fetch_object();
    $_SESSION = [
        'username' => $found->username,
        'email'    => $found->email
    ];
    mysqli_close($connection);
