<?php
    include_once 'common.php';
    $connection = connect_database();
    $channel    = $_POST['channel'];

    $query = "select * from Channel where id = ?";
    if (safe_query($connection, $query, $channel)->get_result()->num_rows === 0) {
        die('channel_error');
    }
    $query = "
        select Message.*, username, avatar
        from Message
            inner join User on Message.author = User.id
        where channel = ?
        order by Message.id
        limit 50";
    print json_encode(
            safe_query($connection, $query, $channel)
                ->get_result()
                ->fetch_all(MYSQLI_ASSOC));
    mysqli_close($connection);