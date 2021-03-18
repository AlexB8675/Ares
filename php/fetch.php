<?php
    include_once 'common.php';
    function fetch_avatar(mysqli $connection, string $author): string {
        $query  = "select avatar from User where username = ?";
        $result = safe_query($connection, $query, $author)->get_result();
        if ($result->num_rows === 0) {
            die('unknown_user');
        }
        $result = $result->fetch_object();
        if (is_null($result->avatar)) {
            return '';
        }
        return $result->avatar;
    }

    start_session();
    $connection = connect_database();
    $kind       = $_POST['kind'];
    print match ($kind) {
        'username' => $_SESSION['username'],
        'email'    => $_SESSION['email'],
        'avatar'   => fetch_avatar($connection, $_POST['author']),
        default     => die('unknown_kind')
    };
    mysqli_close($connection);
