DROP DATABASE IF EXISTS 18fasting;
CREATE DATABASE 18fasting;
USE 18fasting;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS Users;
DROP TABLE If EXISTS Bible;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE Bible_lecture_time (
	blt_id int not null auto_increment,
	start_time timestamp not null default CURRENT_TIMESTAMP,
	end_time timestamp not null default CURRENT_TIMESTAMP,
	PRIMARY KEY (blt_id)
);

CREATE TABLE Classes_lecture_time (
	clt_id int not null auto_increment,
	start_time timestamp not null default CURRENT_TIMESTAMP,
	end_time timestamp not null default CURRENT_TIMESTAMP,
	PRIMARY KEY (clt_id)
);

CREATE TABLE Classes (
	cid int not null auto_increment,
	title varchar(255) not null,
	speaker varchar(255) not null,
	max int not null,
	current int not null,
	details varchar(3000),
	field varchar(255),
	link varchar(255),
	CHECK (current <= max),
	CHECK (current >= 0),
	PRIMARY KEY (cid)
);

CREATE TABLE Bible (
	bid int not null auto_increment,
	title varchar(255) not null,
	speaker varchar(255) not null,
	max int not null,
	current int not null,
	details varchar(3000),
	link varchar(255),
	CHECK (current <= max),
	CHECK (current >= 0),
	PRIMARY KEY (bid)
);

CREATE TABLE Users (
  uid int not null auto_increment,
  name varchar(255) not null,
  password varchar(255) not null,
  earth varchar(255) not null,
  campus varchar(255) not null,
  year varchar(255) not null,
  cid int,
  bid int,
  PRIMARY KEY (uid),
  FOREIGN KEY (cid) REFERENCES Classes(cid) ON DELETE SET NULL,
  FOREIGN KEY (bid) REFERENCES Bible(bid) ON DELETE SET NULL
);


-- returns minutes left before the next lecture
CREATE OR REPLACE VIEW Classes_countdown AS
SELECT
    MIN(IFNULL((
		SELECT MIN(IF(c.start_time > NOW(), TIMESTAMPDIFF(MINUTE, NOW(), c.start_time), 0))
		FROM Classes_lecture_time c
		WHERE NOW() <= c.end_time
		), 0))
	AS countdown;

CREATE OR REPLACE VIEW Bible_countdown AS
SELECT
    MIN(IFNULL((
		SELECT MIN(IF(b.start_time > NOW(), TIMESTAMPDIFF(MINUTE, NOW(), b.start_time), 0))
		FROM Bible_lecture_time b
		WHERE NOW() <= b.end_time
		), 0))
	AS countdown;

delimiter |
CREATE TRIGGER registerClass BEFORE UPDATE ON Classes
	FOR EACH ROW BEGIN
		IF NEW.current > NEW.max or NEW.current < 0 THEN
			SIGNAL SQLSTATE '45000';
		END IF;
	END;
	|
delimiter ;

delimiter |
CREATE TRIGGER registerBible BEFORE UPDATE ON Bible
	FOR EACH ROW BEGIN
		IF NEW.current > NEW.max or NEW.current < 0 THEN
			SIGNAL SQLSTATE '45000';
		END IF;
	END;
	|
delimiter ;

ALTER DATABASE 18fasting CHARACTER SET utf8 COLLATE utf8_general_ci;

ALTER TABLE Classes CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;
ALTER TABLE Bible CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;
ALTER TABLE Users CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;