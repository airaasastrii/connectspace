ALTER TABLE `posts`
    ADD COLUMN `location_name` VARCHAR(255) NULL;

ALTER TABLE `comments`
    ADD COLUMN `location_name` VARCHAR(255) NULL;
