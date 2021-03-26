<?php
    include_once 'common.php';
    function insert_avatar(mysqli $connection, int $author, string $path) {
        $image = @imagecreatefromstring(file_get_contents($path));
        if (!$image) {
            die('unsupported_format');
        }

        $target = "../assets/avatars/$author";
        if (!is_dir($target)) {
            mkdir($target);
        }

        imagepng(imagescale($image , 256, 256), "$target/avatar.png", 0);
        $query = "
            update User
            set avatar = ?
            where id = ?";
        safe_query($connection, $query, "assets/avatars/$author/avatar.png", $author);
    }

    start_session();
    $connection = connect_database();
    $kind       = $_POST['kind'];

    switch ($kind) {
        case 'avatar': {
            insert_avatar($connection, $_SESSION['id'], $_FILES['avatar']['tmp_name']);
        } break;

        default: {
            die('unknown_kind');
        }
    }
    mysqli_close($connection);
