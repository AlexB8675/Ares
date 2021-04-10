<?php
    include_once 'common.php';
    $connection = connect_database();
    $user       = $_GET['id'];
    $guild      = $_GET['guild'];
    $channel    = $_GET['channel'];

    $query = "select * from UserGuild where user_id = ? and guild_id = ?";
    if (safe_query($connection, $query, $user, $guild)->num_rows === 0) {
        die('user_guild_error');
    }

    $query = "select * from Channel where guild = ? and id = ?";
    if (safe_query($connection, $query, $guild, $channel)->num_rows === 0) {
        die('channel_guild_error');
    }
