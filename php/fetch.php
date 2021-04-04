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

    function fetch_guilds(mysqli $connection, int $user): string {
        $query = "
            select id, name
            from UserGuild
                inner join Guild on UserGuild.guild_id = Guild.id
            where user_id = ?";
        $result = safe_query($connection, $query, $user)->get_result();
        $data   = array();
        while ($row = $result->fetch_object()) {
            $data[] = $row;
        }
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
        default     => die('unknown_kind')
    };
    mysqli_close($connection);
