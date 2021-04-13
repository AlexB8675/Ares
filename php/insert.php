<?php
    include_once 'common.php';
    function insert_avatar(mysqli $connection, int $user, string $path): string {
        $image = @imagecreatefromstring(file_get_contents($path));
        if (!$image) {
            die('{ "message": "unsupported_format", "code": 400 }');
        }
        $target = "assets/avatars/$user";
        if (!is_dir("../$target")) {
            mkdir("../$target", 0777, true);
        }
        imagepng(imagescale($image, 256, 256), "../$target/avatar.png", 0);
        $query = "
            update User
            set avatar = ?
            where id = ?";
        safe_query($connection, $query, "$target/avatar.png", $user);
        return '{}';
    }

    function insert_guild(mysqli $connection, int $id, int $user, string $name): string {
        $query = "insert into Guild value (?, ?, null)"; // TODO: Maybe insert a Guild icon at creation-time?
        safe_query($connection, $query, $id, $name);
        $query = "insert into UserGuild value (?, ?)";
        safe_query($connection, $query, $user, $id);
        $query = "insert into Channel value (?, ?, ?)";
        safe_query($connection, $query, $id + 1, $id, "default");
        return '{}';
    }

    function insert_message(mysqli $connection, string $message): string {
        $data    = json_decode($message, true);
        $query   = "insert into Message value (?, ?, ?, ?)";
        $id      = intval($data['message']['id']);
        $user    = intval($data['id']);
        $channel = intval($data['channel']);
        $content = $data['message']['content'];
        safe_query($connection, $query, $id, $user, $channel, $content);
        return '{}';
    }

    function join_guild(mysqli $connection, int $id, int $user): string {
        $query = "select name from Guild where id = ?";
        $guild = safe_query($connection, $query, $id)->get_result();
        if ($guild->num_rows === 0) {
            die('{ "message": "unauthorized", "code": 401 }');
        }
        $query = "select * from UserGuild where guild_id = ? and user_id = ?";
        if (safe_query($connection, $query, $id, $user)->get_result()->num_rows !== 0) {
            die('{ "message": "forbidden", "code": 403 }');
        }
        $query = "insert into UserGuild value (?, ?)";
        safe_query($connection, $query, $user, $id);
        return json_encode($guild->fetch_object());
    }

    check_authorization();
    $connection = connect_database();
    print match ($_POST['kind']) {
        'avatar'  => insert_avatar($connection, $_SESSION['id'], $_FILES['avatar']['tmp_name']),
        'guild'   => insert_guild($connection, intval($_POST['id']), $_SESSION['id'], $_POST['name']),
        'message' => insert_message($connection, $_POST['message']),
        'join'    => join_guild($connection, intval($_POST['id']), $_SESSION['id']),
        default    => die('{ "message": "bad_request", "code": 400 }')
    };
    mysqli_close($connection);
