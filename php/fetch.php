<?php
    include_once 'common.php';
    function fetch_avatar(mysqli $connection, int $user): string {
        $query  = "select avatar from User where id = ?";
        $result = safe_query($connection, $query, $user)->get_result();
        if ($result->num_rows === 0) {
            die('unknown_user');
        }
        $result = $result->fetch_object();
        if (is_null($result->avatar)) {
            return '';
        }
        return $result->avatar;
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

    start_session();
    $connection = connect_database();
    $kind       = $_POST['kind'];
    print match ($kind) {
        'username' => $_SESSION['username'],
        'email'    => $_SESSION['email'],
        'id'       => $_SESSION['id'],
        'avatar'   => fetch_avatar($connection, intval($_POST['id'])),
        'guild'    => fetch_guilds($connection, $_SESSION['id']),
        'channels' => fetch_channels($connection, intval($_POST['id'])),
        default     => die('unknown_kind')
    };
    mysqli_close($connection);
