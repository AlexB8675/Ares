<?php
    include_once 'common.php';
    function insert_avatar(mysqli $connection, string $author, string $path) {
        $image    = imagecreatefromstring(file_get_contents($path));
        $scale_40 = imagescale($image , 40, 40);
        $scale_80 = imagescale($image , 80, 80);
        $target   = "../assets/avatars/$author";

        mkdir($target);
        imagepng($scale_40, $target.'/avatar40.png', 0, PNG_ALL_FILTERS);
        imagepng($scale_80, $target.'/avatar80.png', 0, PNG_ALL_FILTERS);
        $query = "
            update User
            set avatar = ?
            where username = ?";
        safe_query($connection, $query, "assets/avatars/$author", $author);

    }

    start_session();
    $connection = connect_database();
    $kind       = $_POST['kind'];
    $author     = $_POST['author'];

    switch ($kind) {
        case 'avatar': {
            insert_avatar($connection, $author, $_FILES['avatar']['tmp_name']);
        } break;

        default: {
            die('unknown_kind');
        }
    }
    mysqli_close($connection);
