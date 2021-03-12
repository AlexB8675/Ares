drop database Phobos;
create database Phobos;
use Phobos;

create table User (
    id       int                 not null auto_increment,
    username varchar(128) unique not null,
    email    varchar(128) unique not null,
    password varchar(128)        not null,

    primary key (id)
);

create table Guild (
    id   int         not null auto_increment,
    name varchar(32) not null,

    primary key (id)
);

create table UserGuild (
    user_id  int not null,
    guild_id int not null,

    primary key (user_id, guild_id),
    foreign key (user_id)
        references User(id)
            on delete cascade
            on update cascade,
    foreign key (guild_id)
        references Guild(id)
            on delete cascade
            on update cascade
);

create table Message (
    id      int  not null auto_increment,
    author  int  not null,
    guild   int  not null,
    content text not null,

    primary key (id),
    foreign key (author)
        references User(id)
            on delete cascade
            on update cascade,
    foreign key (guild)
        references Guild(id)
            on delete cascade
            on update cascade
);
