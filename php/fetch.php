<?php
    include_once 'common.php';
    function fetch_avatar(mysqli $connection, int $user): string {
        $query  = "select avatar from User where id = ?";
        $user   = $user === 0 ? $_SESSION['id'] : $user;
        $result = safe_query($connection, $query, $user)->get_result();
        if ($result->num_rows === 0) {
            die('{ "message": "forbidden", "code": 403 }');
        }
        $data = $result->fetch_object();
        return json_encode($data);
    }

    function fetch_guilds(mysqli $connection, int $user): string {
        $query = "
            select cast(id as char(20)) as id, name
            from UserGuild
                inner join Guild on UserGuild.guild_id = Guild.id
            where user_id = ?";
        $data =
            safe_query($connection, $query, $user)
                ->get_result()
                ->fetch_all(MYSQLI_ASSOC);
        return json_encode($data);
    }

    function fetch_channels(mysqli $connection, int $guild): string {
        $query = "
            select cast(id as char(20)) as id, name
            from Channel
            where guild = ?";
        $data =
            safe_query($connection, $query, $guild)
                ->get_result()
                ->fetch_all(MYSQLI_ASSOC);
        return json_encode($data);
    }

    check_authorization();
    $connection = connect_database();
    $kind       = $_GET['kind'];
    print match ($kind) {
        'username' => json_encode(['username' => $_SESSION['username']]),
        'email'    => json_encode(['email' => $_SESSION['email']]),
        'id'       => json_encode(['id' => strval($_SESSION['id'])]),
        'avatar'   => fetch_avatar($connection, intval($_GET['id'])),
        'guild'    => fetch_guilds($connection, $_SESSION['id']),
        'channels' => fetch_channels($connection, intval($_GET['id'])),
        default     => die('{ "message": "bad_request", "code": 400 }')
    };
