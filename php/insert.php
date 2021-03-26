<?php
    include_once 'common.php';
    function insert_avatar(mysqli $connection, int $user, string $path) {
        $image = @imagecreatefromstring(file_get_contents($path));
        if (!$image) {
            die('unsupported_format');
        }

        $target = "../assets/avatars/$user";
        if (!is_dir($target)) {
            mkdir($target);
        }

        imagepng(imagescale($image , 256, 256), "$target/avatar.png", 0);
        $query = "
            update User
            set avatar = ?
            where id = ?";
        safe_query($connection, $query, "assets/avatars/$user/avatar.png", $user);
    }

    function insert_guild(mysqli $connection, int $id, string $name) {
        $query = "insert into Guild value (?, ?, null)";
        safe_query($connection, $query, $id, $name);
    }

    start_session();
    $connection = connect_database();
    $kind       = $_POST['kind'];

    switch ($kind) {
        case 'avatar': {
            insert_avatar($connection, $_SESSION['id'], $_FILES['avatar']['tmp_name']);
        } break;

        case 'guild': {
            insert_guild($connection, $_POST['id'], $_POST['name']);
        } break;

        default: {
            die('unknown_kind');
        }
    }
    mysqli_close($connection);
