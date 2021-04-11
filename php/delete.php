<?php
    include_once 'common.php';
    function leave_guild(mysqli $connection, int $guild, int $user) {
        $query = "delete from UserGuild where guild_id = ? and user_id = ?";
        if (!safe_query($connection, $query, $guild, $user)) {
            die('query_error');
        }
    }

    start_session();
    $connection = connect_database();
    switch ($_POST['kind']) {
        case 'guild': {
            leave_guild($connection, intval($_POST['id']), $_SESSION['id']);
        } break;

        default: {
            die('unknown_kind');
        }
    }
    mysqli_close($connection);