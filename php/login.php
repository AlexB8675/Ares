<?php
    include_once 'connect.php';
    $connection = connect_database();
    $username = $_POST['username'];
    $password = hash('sha512', $_POST['password']);
    $exists =
        "select * 
         from User
         where username = '$username' and
               password = '$password'
         limit 1";
    $connection->query($exists)->num_rows == 1 or die('not_found');