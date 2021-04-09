create table User (
    id       char(20)     unique not null,
    username varchar(128) unique not null,
    email    varchar(128) unique not null,
    password char(128)           not null,
    avatar   varchar(128),

    primary key (id)
);

create table Guild (
    id     char(20)     not null,
    name   varchar(128) not null,
    avatar varchar(128),

    primary key (id)
);

create table Channel (
    id    char(20)     not null,
    guild char(20)     not null,
    name  varchar(128) not null,

    primary key (id),
    foreign key (guild)
        references Guild(id)
            on delete cascade
            on update cascade
);

create table UserGuild (
    user_id  char(20) not null,
    guild_id char(20) not null,

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
    id      char(20) not null,
    author  char(20) not null,
    channel char(20) not null,
    content text     not null,

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
