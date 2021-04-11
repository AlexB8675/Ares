<?php
    include_once 'common.php';
    function insert_avatar(mysqli $connection, int $user, string $path): void {
        $image = @imagecreatefromstring(file_get_contents($path));
        if (!$image) {
            die('unsupported_format');
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
    }

    function insert_guild(mysqli $connection, int $id, int $user, string $name): void {
        $query = "insert into Guild value (?, ?, null)"; // TODO: Maybe insert a Guild icon at creation-time?
        safe_query($connection, $query, $id, $name);
        $query = "insert into UserGuild value (?, ?)";
        safe_query($connection, $query, $user, $id);
        $query = "insert into Channel value (?, ?, ?)";
        safe_query($connection, $query, $id + 1, $id, "default");
    }

    function insert_message(mysqli $connection, string $message): void {
        $data    = json_decode($message, true);
        $query   = "insert into Message value (?, ?, ?, ?)";
        $id      = intval($data['message']['id']);
        $user    = intval($data['id']);
        $channel = intval($data['channel']);
        $content = $data['message']['content'];
        safe_query($connection, $query, $id, $user, $channel, $content);
    }

    function join_guild(mysqli $connection, int $id, int $user): void {
        $query = "select name from Guild where id = ?";
        $guild = safe_query($connection, $query, $id)->get_result();
        if ($guild->num_rows === 0) {
            die('not_found');
        }
        $query = "select * from UserGuild where guild_id = ? and user_id = ?";
        if (safe_query($connection, $query, $id, $user)->get_result()->num_rows !== 0) {
            die('already_joined');
        }
        $query = "insert into UserGuild value (?, ?)";
        safe_query($connection, $query, $user, $id);
        print $guild->fetch_object()->name;
    }

    start_session();
    $connection = connect_database();
    switch ($_POST['kind']) {
        case 'avatar':  insert_avatar($connection, $_SESSION['id'], $_FILES['avatar']['tmp_name']); break;
        case 'guild':   insert_guild($connection, intval($_POST['id']), $_SESSION['id'], $_POST['name']); break;
        case 'message': insert_message($connection, $_POST['message']); break;
        case 'join':    join_guild($connection, intval($_POST['id']), $_SESSION['id']); break;
        default:        die('unknown_kind');
    }
    mysqli_close($connection);
