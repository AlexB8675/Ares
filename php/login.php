<?php
    include_once 'vendor/autoload.php';
    include_once 'common.php';
    use Firebase\JWT\JWT;
    $connection = connect_database();
    $username = $_GET['username'];
    $password = hash('sha512', $_GET['password']);
    $exists = '
        select * 
        from User
        where username = ? and
              password = ?';
    $found = safe_query($connection, $exists, $username, $password)->get_result();
    if ($found->num_rows === 0) {
        die('{ "message": "unauthorized", "code": 401 }');
    }
    if (!session_start()) {
        die('{ "message": "unauthorized", "code": 401 }');
    }

    $found = $found->fetch_object();
    $_SESSION = [
        'token'    => JWT::encode([
            'username' => $found->username,
            'email'    => $found->email,
            'id'       => $found->id
        ], $found->password),
        'username' => $found->username,
        'email'    => $found->email,
        'id'       => $found->id
    ];
    print json_encode(['token' => $_SESSION['token']]);
    mysqli_close($connection);
