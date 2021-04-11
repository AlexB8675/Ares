create table User (
    id       bigint       unique not null,
    username varchar(128) unique not null,
    email    varchar(128) unique not null,
    password char(128)           not null,
    avatar   varchar(128),

    primary key (id)
);

create table Guild (
    id     bigint       not null,
    name   varchar(128) not null,
    avatar varchar(128),

    primary key (id)
);

create table Channel (
    id    bigint       not null,
    guild bigint       not null,
    name  varchar(128) not null,

    primary key (id),
    foreign key (guild)
        references Guild(id)
            on delete cascade
            on update cascade
);

create table UserGuild (
    user_id  bigint not null,
    guild_id bigint not null,

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
    id      bigint not null,
    author  bigint not null,
    channel bigint not null,
    content text   not null,

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
