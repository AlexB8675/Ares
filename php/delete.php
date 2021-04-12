<?php
    include_once 'common.php';
    function leave_guild(mysqli $connection, int $guild, int $user): void {
        $query = "delete from UserGuild where guild_id = ? and user_id = ?";
        if (!safe_query($connection, $query, $guild, $user)) {
            die('{ "message": "query_error", "code": 500 }');
        }
        print '{}';
    }

    check_authorization();
    $connection = connect_database();
    switch ($_POST['kind']) {
        case 'guild': leave_guild($connection, intval($_POST['id']), $_SESSION['id']); break;
        default:      die('{ "message": "bad_request", "code": 400 }');
    }