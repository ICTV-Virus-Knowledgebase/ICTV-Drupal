
DELIMITER //

DROP PROCEDURE IF EXISTS `calculateUniquenessScores`;

CREATE PROCEDURE `calculateUniquenessScores`(
	
   -- The percentage of the name's length to use when calculating differences.
	IN `percentOfLength` INT,

   -- The taxon name that will be evaluated.
   IN `taxonNameID` INT
)
BEGIN

   DECLARE sameCountScore INT;
   
   SET sameCountScore = 0;


   SELECT * -- COUNT(*) INTO sameCountScore
   FROM taxon_histogram searchName
   JOIN taxon_histogram potentialMatch ON (
      searchName._a = potentialMatch._a
      AND searchName._b = potentialMatch._b
      AND searchName._c = potentialMatch._c
      AND searchName._d = potentialMatch._d
      AND searchName._e = potentialMatch._e
      AND searchName._f = potentialMatch._f
      AND searchName._g = potentialMatch._g
      AND searchName._h = potentialMatch._h
      AND searchName._i = potentialMatch._i
      AND searchName._j = potentialMatch._j
      AND searchName._k = potentialMatch._k
      AND searchName._l = potentialMatch._l
      AND searchName._m = potentialMatch._m
      AND searchName._n = potentialMatch._n
      AND searchName._o = potentialMatch._o
      AND searchName._p = potentialMatch._p
      AND searchName._q = potentialMatch._q
      AND searchName._r = potentialMatch._r
      AND searchName._s = potentialMatch._s
      AND searchName._t = potentialMatch._t
      AND searchName._u = potentialMatch._u
      AND searchName._v = potentialMatch._v
      AND searchName._w = potentialMatch._w
      AND searchName._x = potentialMatch._x
      AND searchName._y = potentialMatch._y
      AND searchName._z = potentialMatch._z
      AND searchName._1 = potentialMatch._1
      AND searchName._2 = potentialMatch._2
      AND searchName._3 = potentialMatch._3
      AND searchName._4 = potentialMatch._4
      AND searchName._5 = potentialMatch._5
      AND searchName._6 = potentialMatch._6
      AND searchName._7 = potentialMatch._7
      AND searchName._8 = potentialMatch._8
      AND searchName._9 = potentialMatch._9
      AND searchName._0 = potentialMatch._0
      AND searchName._ = potentialMatch._
   )
   WHERE searchName.id = taxonNameID
   AND potentialMatch.id <> taxonNameID;

   -- Update the taxon histogram with the same count score.
   -- UPDATE taxon_histogram SET same_count_score = sameCountScore WHERE taxon_name_id = taxonNameID;


   -- SELECT sameCountScore;
   

   /*
   _a INTO aCount,
      _b INTO bCount,
      _c INTO cCount,
      _d INTO dCount,
      _e INTO eCount,
      _f INTO fCount,
      _g INTO gCount,
      _h INTO hCount,
      _i INTO iCount,
      _j INTO jCount,
      _k INTO kCount,
      _l INTO lCount,
      _m INTO mCount,
      _n INTO nCount,
      _o INTO oCount,
      _p INTO pCount,
      _q INTO qCount,
      _r INTO rCount,
      _s INTO sCount,
      _t INTO tCount,
      _u INTO uCount,
      _v INTO vCount,
      _w INTO wCount,
      _x INTO xCount,
      _y INTO yCount,
      _z INTO zCount,
      _1 INTO 1Count,
      _2 INTO 2Count,
      _3 INTO 3Count,
      _4 INTO 4Count,
      _5 INTO 5Count,
      _6 INTO 6Count,
      _7 INTO 7Count,
      _8 INTO 8Count,
      _9 INTO 9Count,
      _0 INTO 0Count,
      _ INTO spaceCount



   */

END//
DELIMITER ;