drop database Phobos;
create database Phobos;
use Phobos;

create table User (
    id       int                 not null auto_increment,
    avatar   varchar(128),
    email    varchar(128) unique not null,
    username varchar(128) unique not null,
    password char(128)           not null,

    primary key (id)
);

create table Guild (
    id   int          not null auto_increment,
    name varchar(128) not null,

    primary key (id)
);

create table Channel (
    id    int          not null auto_increment,
    guild int          not null,
    name  varchar(128) not null,

    primary key (id),
    foreign key (guild)
        references Guild(id)
            on delete cascade
            on update cascade
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
    id        int  not null auto_increment,
    author    int  not null,
    channel   int  not null,
    content   text not null,
    timestamp int  not null,

    primary key (id),
    foreign key (author)
        references User(id)
            on delete cascade
            on update cascade,
    foreign key (channel)
        references Channel(id)
            on delete cascade
            on update cascade
);
