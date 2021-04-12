<?php
    include_once 'common.php';
    check_authorization();
    $connection = connect_database();
    $channel    = $_GET['channel'];

    $query = "
        select cast(id as char(20)),
               cast(guild as char(20)),
               name
        from Channel
        where id = ?";
    if (safe_query($connection, $query, $channel)->get_result()->num_rows === 0) {
        die('{ "message": "unknown_channel", "code": 400 }');
    }
    $query = "
        select cast(Message.id as char(20)) as id,
               cast(Message.author as char(20)) as author,
               cast(Message.channel as char(20)) as channel,
               content,
               username,
               avatar
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