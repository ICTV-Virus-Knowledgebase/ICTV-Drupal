-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               10.6.5-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for ictv_apps
CREATE DATABASE IF NOT EXISTS `ictv_apps` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `ictv_apps`;

-- Dumping structure for procedure ictv_apps.createJob
DELIMITER //
CREATE PROCEDURE `createJob`(
	IN filename VARCHAR(200),
	IN userEmail VARCHAR(100),
	IN userUID INT
)
BEGIN
	
	-- Declare variables used below.
	DECLARE jobUID VARCHAR(100);
	DECLARE statusTID INT;
	
	
	-- Validate the filename
	IF filename IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid filename parameter';
	END IF;
	
	-- Validate the user email
	IF userEmail IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user email parameter';
	END IF;
	
	-- Validate the user UID
	IF userUID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user UID parameter';
	END IF;
	
	
	-- Lookup the term ID for the status (jobs always start with "pending" status).
	SET statusTID := (
		SELECT id 
		FROM term 
		WHERE full_key = CONCAT('job_status.pending')
		LIMIT 1
	);
	
	IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status.pending';
	END IF;
	
	-- Generate a new job UID
	SET jobUID = REPLACE(CAST(UUID() AS VARCHAR(100)),'-','');
  	
  	
  	-- Create the new job record.
  	INSERT INTO job (
  		`filename`,
		`status_tid`,
		`uid`,
		`user_email`,
		`user_uid`
	) VALUES (
		filename,
		statusTID,
		jobUID,
		userEmail,
		userUID
	);

	SELECT jobUID;
	
END//
DELIMITER ;

-- Dumping structure for table ictv_apps.job
CREATE TABLE IF NOT EXISTS `job` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `completed_on` datetime DEFAULT NULL,
  `created_on` datetime DEFAULT current_timestamp(),
  `failed_on` datetime DEFAULT NULL,
  `filename` varchar(200) NOT NULL,
  `message` text DEFAULT NULL,
  `status_tid` int(10) unsigned DEFAULT NULL,
  `type_tid` int(10) unsigned DEFAULT NULL,
  `uid` varchar(100) NOT NULL,
  `user_email` text NOT NULL,
  `user_uid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_status_tid` (`status_tid`),
  CONSTRAINT `FK_status_tid` FOREIGN KEY (`status_tid`) REFERENCES `term` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;

-- Dumping data for table ictv_apps.job: ~6 rows (approximately)
/*!40000 ALTER TABLE `job` DISABLE KEYS */;
INSERT INTO `job` (`id`, `completed_on`, `created_on`, `failed_on`, `filename`, `message`, `status_tid`, `type_tid`, `uid`, `user_email`, `user_uid`) VALUES
	(2, NULL, '2023-03-21 18:27:02', NULL, 'testFile1.xlsx', NULL, 1, NULL, '8fc42f11d40b11edabbb334ad75b423a', 'don.dempsey@gmail.com', 1),
	(3, NULL, '2023-04-05 14:27:13', NULL, 'testFile2.xlsx', NULL, 1, NULL, '9949a7f3d40b11edabbb334ad75b423a', 'me@me.com', 777),
	(5, NULL, '2023-04-05 17:37:00', NULL, 'testFile2.xlsx', NULL, 1, NULL, 'a0e0bbb6d40b11edabbb334ad75b423a', 'don.dempsey@gmail.com', 1),
	(6, NULL, '2023-04-05 18:20:07', NULL, 'testFile.xlsx', NULL, 1, NULL, '7e666292d40b11edabbb334ad75b423a', 'don.dempsey@gmail.com', 1),
	(7, NULL, '2023-04-05 19:23:13', NULL, 'testFile.xlsx', NULL, 1, NULL, '3c49dbe4d41111edabbb334ad75b423a', 'ddempsey@uab.edu', 555),
	(17, NULL, '2023-05-22 21:25:13', NULL, 'SuperheroNames.xlsx', NULL, 1, NULL, '0e41fdb2f91111eda50420f56b39dda7', 'don.dempsey@gmail.com', 1);
/*!40000 ALTER TABLE `job` ENABLE KEYS */;

-- Dumping structure for table ictv_apps.term
CREATE TABLE IF NOT EXISTS `term` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) DEFAULT NULL,
  `full_key` varchar(256) NOT NULL,
  `label` varchar(128) NOT NULL,
  `term_key` varchar(128) NOT NULL,
  `vocab_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_vocabulary` (`vocab_id`),
  CONSTRAINT `FK_vocabulary` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Dumping data for table ictv_apps.term: ~4 rows (approximately)
/*!40000 ALTER TABLE `term` DISABLE KEYS */;
INSERT INTO `term` (`id`, `description`, `full_key`, `label`, `term_key`, `vocab_id`) VALUES
	(1, NULL, 'job_status.pending', 'pending', 'pending', 1),
	(2, NULL, 'job_status.running', 'running', 'running', 1),
	(3, NULL, 'job_status.failed', 'failed', 'failed', 1),
	(4, NULL, 'job_status.completed', 'completed', 'completed', 1);
/*!40000 ALTER TABLE `term` ENABLE KEYS */;

-- Dumping structure for procedure ictv_apps.updateJob
DELIMITER //
CREATE PROCEDURE `updateJob`(
	IN jobUID VARCHAR(100),
	IN message VARCHAR(200),
	IN status VARCHAR(50),
	IN userUID INT
)
BEGIN

	DECLARE fullStatus VARCHAR(100);
	DECLARE statusTID INT;
	
	
	-- Validate the jobUID
	IF jobUID IS NULL OR jobUID = '' THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid jobUID parameter';
	END IF;

	-- Validate the user UID
	IF userUID IS NULL THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid userUID parameter';
	END IF;

	-- Validate the status
	IF status IS NULL OR status = '' THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status parameter';
	END IF;

	SET fullStatus = CONCAT('job_status.', status);
	
	-- Lookup the term ID for the status.
	SET statusTID := (
		SELECT id 
		FROM term 
		WHERE full_key = fullStatus
		LIMIT 1
	);

	/*IF statusTID IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid term ID for job_status parameter'
	END IF;*/

  
	-- The status determines how the job is updated.
	IF status = 'completed' THEN
		
		-- Update the job as completed.
		UPDATE job SET
			completed_on = NOW(), 
			status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	ELSEIF status = 'failed' THEN
		
		-- Update the job as failed and include the error message.
		UPDATE job SET
			failed_on = NOW(), 
			message = message,
			status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	ELSEIF status = 'running' THEN

		-- Update the job as running.
		UPDATE job SET status_tid = statusTID
		WHERE uid = jobUID
		AND user_uid = userUID;

	END IF;

END//
DELIMITER ;

-- Dumping structure for table ictv_apps.vocabulary
CREATE TABLE IF NOT EXISTS `vocabulary` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) DEFAULT NULL,
  `label` varchar(128) NOT NULL,
  `vocab_key` varchar(128) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Dumping data for table ictv_apps.vocabulary: ~0 rows (approximately)
/*!40000 ALTER TABLE `vocabulary` DISABLE KEYS */;
INSERT INTO `vocabulary` (`id`, `description`, `label`, `vocab_key`) VALUES
	(1, NULL, 'job status', 'job_status');
/*!40000 ALTER TABLE `vocabulary` ENABLE KEYS */;

-- Dumping structure for view ictv_apps.v_job
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_job` (
	`id` INT(10) UNSIGNED NOT NULL,
	`completed_on` DATETIME NULL,
	`created_on` DATETIME NULL,
	`failed_on` DATETIME NULL,
	`filename` VARCHAR(200) NOT NULL COLLATE 'latin1_swedish_ci',
	`message` TEXT NULL COLLATE 'latin1_swedish_ci',
	`status` VARCHAR(128) NOT NULL COLLATE 'latin1_swedish_ci',
	`status_tid` INT(10) UNSIGNED NULL,
	`type` VARCHAR(128) NULL COLLATE 'latin1_swedish_ci',
	`type_tid` INT(10) UNSIGNED NULL,
	`uid` VARCHAR(100) NOT NULL COLLATE 'latin1_swedish_ci',
	`user_email` TEXT NOT NULL COLLATE 'latin1_swedish_ci',
	`user_uid` INT(11) NULL
) ENGINE=MyISAM;

-- Dumping structure for view ictv_apps.v_job
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_job`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_job` AS SELECT 
	j.id,
	j.completed_on,
	j.created_on,
	j.failed_on,
	j.filename,
	j.message,
	statusterm.term_key AS status,
	j.status_tid,
	typeterm.term_key AS type,
	j.type_tid,
	j.uid,
	j.user_email,
	j.user_uid
	
FROM job j
JOIN term statusterm ON statusterm.id = status_tid
LEFT JOIN term typeterm ON typeterm.id = type_tid ;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
