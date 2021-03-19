<?php
    include_once 'common.php';
    function fetch_avatar(mysqli $connection, int $id): string {
        $query  = "select avatar from User where id = ?";
        $result = safe_query($connection, $query, $id)->get_result();
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
        'id'       => $_SESSION['id'],
        'avatar'   => fetch_avatar($connection, intval($_POST['id'])),
        default     => die('unknown_kind')
    };
    mysqli_close($connection);
