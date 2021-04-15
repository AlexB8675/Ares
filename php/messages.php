<?php
    include_once 'common.php';
    check_authorization();
    $connection = connect_database();
    $channel    = $_GET['channel'];
    $direction  = $_GET['direction'];
    $last       = 'where channel = ? order by id desc limit 50';
    if (isset($_GET['last'])) {
        $last = 'where channel = ? and Message.id '.($direction === 'up' ? '>' : '<').' ? order by id limit 50';
    }

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
        select * from
            (select cast(Message.id as char(20)) as id,
                    cast(Message.author as char(20)) as author,
                    cast(Message.channel as char(20)) as channel,
                    content,
                    username,
                    avatar
            from Message
                inner join User on Message.author = User.id
            $last) as Next
        order by id";
    print
        json_encode(
            (!isset($_GET['last']) ?
                safe_query($connection, $query, $channel) :
                safe_query($connection, $query, $channel, $_GET['last']))
                    ->get_result()
                    ->fetch_all(MYSQLI_ASSOC));
    mysqli_close($connection);