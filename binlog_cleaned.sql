
# The proper term is pseudo_replica_mode, but we use this compatibility alias
# to make the statement usable on server versions 8.0.24 and older.
DELIMITER /*!*/;
# at 4
#260127 21:56:26 server id 1  end_log_pos 127 CRC32 0xac4a3da2 	Start: binlog v 4, server v 8.4.6 created 260127 21:56:
26 at startup
ROLLBACK/*!*/;
# at 127
#260127 21:56:26 server id 1  end_log_pos 158 CRC32 0xe6b5bd0d 	Previous-GTIDs
# [empty]
# at 158
#260127 21:56:31 server id 1  end_log_pos 237 CRC32 0xac03505c 	Anonymous_GTID	last_committed=0	sequence_number=1	rbr_o
nly=yes	original_committed_timestamp=1769518591106754	immediate_commit_timestamp=1769518591106754	transaction_length=66
5
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769518591106754 (2026-01-27 21:56:31.106754 대한민국 표준시)
# immediate_commit_timestamp=1769518591106754 (2026-01-27 21:56:31.106754 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769518591106754*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 237
#260127 21:56:31 server id 1  end_log_pos 337 CRC32 0xcd71ccd6 	Query	thread_id=10	exec_time=0	error_code=0
SET TIMESTAMP=1769518591/*!*/;
SET @@session.pseudo_thread_id=10/*!*/;
SET @@session.foreign_key_checks=1, @@session.sql_auto_is_null=0, @@session.unique_checks=1, @@session.autocommit=1/*!*
/;
SET @@session.sql_mode=1168113696/*!*/;
SET @@session.auto_increment_increment=1, @@session.auto_increment_offset=1/*!*/;
/*!\C utf8mb4 *//*!*/;
SET @@session.character_set_client=45,@@session.collation_connection=45,@@session.collation_server=224/*!*/;
SET @@session.time_zone='SYSTEM'/*!*/;
SET @@session.lc_time_names=0/*!*/;
SET @@session.collation_database=DEFAULT/*!*/;
/*!80011 SET @@session.default_collation_for_utf8mb4=255*//*!*/;
BEGIN
/*!*/;
# at 337
#260127 21:56:31 server id 1  end_log_pos 430 CRC32 0x88699ac2 	Table_map: `crm_ai_web`.`user` mapped to number 97
# has_generated_invisible_primary_key=0
# at 430
#260127 21:56:31 server id 1  end_log_pos 792 CRC32 0x1e07ebbb 	Update_rows: table id 97 flags: STMT_END_F
### UPDATE `crm_ai_web`.`user`
### WHERE
###   @1='cmkb4qu3r0003pawcy2sc5vyh'
###   @2='admin@company.co.kr'
###   @3='愿由ъ옄'
###   @4='$2b$10$.iatb8PCiF5FNqidKFEI4e/qTxCgwWe.r8O7mpIdKTOhzrW8CNvW6'
###   @5='ADMIN'
###   @6=1
###   @7=5
###   @8='2026-01-12 12:19:15.302'
###   @9='2026-01-27 12:47:56.082'
###   @10=0
###   @11=1
###   @12=0
###   @13='2026-01-27 07:06:29.314'
###   @14=NULL
###   @15=NULL
###   @16=NULL
### SET
###   @1='cmkb4qu3r0003pawcy2sc5vyh'
###   @2='admin@company.co.kr'
###   @3='愿由ъ옄'
###   @4='$2b$10$IRdxVHTZDeb.46YHnd/TAOW/NNitmGOLsICqH5cNYzc0OePPA1Sve'
###   @5='ADMIN'
###   @6=1
###   @7=5
###   @8='2026-01-12 12:19:15.302'
###   @9='2026-01-27 12:56:31.103'
###   @10=0
###   @11=1
###   @12=0
###   @13='2026-01-27 07:06:29.314'
###   @14=NULL
###   @15=NULL
###   @16=NULL
# at 792
#260127 21:56:31 server id 1  end_log_pos 823 CRC32 0x821f50d2 	Xid = 31
COMMIT/*!*/;
# at 823
#260128 13:18:21 server id 1  end_log_pos 902 CRC32 0x39d7e423 	Anonymous_GTID	last_committed=1	sequence_number=2	rbr_o
nly=yes	original_committed_timestamp=1769573901239780	immediate_commit_timestamp=1769573901239780	transaction_length=44
4
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769573901239780 (2026-01-28 13:18:21.239780 대한민국 표준시)
# immediate_commit_timestamp=1769573901239780 (2026-01-28 13:18:21.239780 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769573901239780*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 902
#260128 13:18:21 server id 1  end_log_pos 993 CRC32 0xff154b0f 	Query	thread_id=73	exec_time=0	error_code=0
SET TIMESTAMP=1769573901/*!*/;
BEGIN
/*!*/;
# at 993
#260128 13:18:21 server id 1  end_log_pos 1087 CRC32 0xd1dd69de 	Table_map: `crm_ai_web`.`customer` mapped to number 11
0
# has_generated_invisible_primary_key=0
# at 1087
#260128 13:18:21 server id 1  end_log_pos 1236 CRC32 0x1edf4d98 	Write_rows: table id 110 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`customer`
### SET
###   @1='cmkxim0tt00005z7htm9x1j3p'
###   @2='?대???
###   @3='010-3859-6284@temp.com'
###   @4='010-3859-6284'
###   @5=NULL
###   @6='ACTIVE'
###   @7=NULL
###   @8='NORMAL'
###   @9=0
###   @10=NULL
###   @11='2026-01-28 04:18:21.231'
###   @12='2026-01-28 04:18:21.231'
# at 1236
#260128 13:18:21 server id 1  end_log_pos 1267 CRC32 0x4e11c580 	Xid = 1406
COMMIT/*!*/;
# at 1267
#260128 13:18:21 server id 1  end_log_pos 1346 CRC32 0xa393809d 	Anonymous_GTID	last_committed=2	sequence_number=3	rbr_
only=yes	original_committed_timestamp=1769573901244578	immediate_commit_timestamp=1769573901244578	transaction_length=6
91
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769573901244578 (2026-01-28 13:18:21.244578 대한민국 표준시)
# immediate_commit_timestamp=1769573901244578 (2026-01-28 13:18:21.244578 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769573901244578*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 1346
#260128 13:18:21 server id 1  end_log_pos 1435 CRC32 0xa1798aa3 	Query	thread_id=73	exec_time=0	error_code=0
SET TIMESTAMP=1769573901/*!*/;
BEGIN
/*!*/;
# at 1435
#260128 13:18:21 server id 1  end_log_pos 1594 CRC32 0xc9faa058 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 1594
#260128 13:18:21 server id 1  end_log_pos 1927 CRC32 0x418bee64 	Write_rows: table id 103 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`afterservice`
### SET
###   @1='cmkxim0u100025z7hxqpr178o'
###   @2='AS-20260128-001'
###   @3='AS-20260128-001'
###   @4='cmkxim0tt00005z7htm9x1j3p'
###   @5=NULL
###   @6='?대???
###   @7='REPAIR'
###   @8='NOISE'
###   @9='RECEIVED'
###   @10='NORMAL'
###   @11='???뚯쓬 - ?섎━鍮?2留뚯썝 ?덈궡??
###   @12='??
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:18:21.239'
###   @19='2026-01-28 04:18:21.242'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:18:21.242'
###   @24='2026-01-28 04:18:21.242'
###   @25=''
###   @26=''
###   @27='遺?곗떆 ?숇옒援?李⑤강怨⑤줈 24 ?꾩씠?덉뒪 501??
###   @28='010-3859-6284'
###   @29=NULL
###   @30=NULL
###   @31=NULL
###   @32=NULL
###   @33=''
###   @34=NULL
###   @35=''
# at 1927
#260128 13:18:21 server id 1  end_log_pos 1958 CRC32 0x7cfd0341 	Xid = 1414
COMMIT/*!*/;
# at 1958
#260128 13:18:35 server id 1  end_log_pos 2037 CRC32 0xd66f9d70 	Anonymous_GTID	last_committed=3	sequence_number=4	rbr_
only=yes	original_committed_timestamp=1769573915141865	immediate_commit_timestamp=1769573915141865	transaction_length=1
000
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769573915141865 (2026-01-28 13:18:35.141865 대한민국 표준시)
# immediate_commit_timestamp=1769573915141865 (2026-01-28 13:18:35.141865 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769573915141865*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 2037
#260128 13:18:35 server id 1  end_log_pos 2135 CRC32 0x7bb03e74 	Query	thread_id=73	exec_time=0	error_code=0
SET TIMESTAMP=1769573915/*!*/;
BEGIN
/*!*/;
# at 2135
#260128 13:18:35 server id 1  end_log_pos 2294 CRC32 0x40a06f6d 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 2294
#260128 13:18:35 server id 1  end_log_pos 2927 CRC32 0x6b3e6f2a 	Update_rows: table id 103 flags: STMT_END_F
### UPDATE `crm_ai_web`.`afterservice`
### WHERE
###   @1='cmkxim0u100025z7hxqpr178o'
###   @2='AS-20260128-001'
###   @3='AS-20260128-001'
###   @4='cmkxim0tt00005z7htm9x1j3p'
###   @5=NULL
###   @6='?대???
###   @7='REPAIR'
###   @8='NOISE'
###   @9='RECEIVED'
###   @10='NORMAL'
###   @11='???뚯쓬 - ?섎━鍮?2留뚯썝 ?덈궡??
###   @12='??
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:18:21.239'
###   @19='2026-01-28 04:18:21.242'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:18:21.242'
###   @24='2026-01-28 04:18:21.242'
###   @25=''
###   @26=''
###   @27='遺?곗떆 ?숇옒援?李⑤강怨⑤줈 24 ?꾩씠?덉뒪 501??
###   @28='010-3859-6284'
###   @29=NULL
###   @30=NULL
###   @31=NULL
###   @32=NULL
###   @33=''
###   @34=NULL
###   @35=''
### SET
###   @1='cmkxim0u100025z7hxqpr178o'
###   @2='AS-20260128-001'
###   @3='AS-20260128-001'
###   @4='cmkxim0tt00005z7htm9x1j3p'
###   @5=NULL
###   @6='?대???
###   @7='REPAIR'
###   @8='NOISE'
###   @9='AS'
###   @10='NORMAL'
###   @11='???뚯쓬 - ?섎━鍮?2留뚯썝 ?덈궡??
###   @12='??
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:18:21.239'
###   @19='2026-01-28 04:18:21.242'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:18:21.242'
###   @24='2026-01-28 04:18:35.136'
###   @25=''
###   @26=''
###   @27='遺?곗떆 ?숇옒援?李⑤강怨⑤줈 24 ?꾩씠?덉뒪 501??
###   @28='010-3859-6284'
###   @29=NULL
###   @30='2026-01-28 00:00:00.000'
###   @31=NULL
###   @32=NULL
###   @33=''
###   @34=NULL
###   @35=''
# at 2927
#260128 13:18:35 server id 1  end_log_pos 2958 CRC32 0x8c2912f4 	Xid = 1425
COMMIT/*!*/;
# at 2958
#260128 13:18:48 server id 1  end_log_pos 3037 CRC32 0xcae9def4 	Anonymous_GTID	last_committed=4	sequence_number=5	rbr_
only=yes	original_committed_timestamp=1769573928388678	immediate_commit_timestamp=1769573928388678	transaction_length=1
007
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769573928388678 (2026-01-28 13:18:48.388678 대한민국 표준시)
# immediate_commit_timestamp=1769573928388678 (2026-01-28 13:18:48.388678 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769573928388678*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 3037
#260128 13:18:48 server id 1  end_log_pos 3135 CRC32 0x1f4f8445 	Query	thread_id=73	exec_time=0	error_code=0
SET TIMESTAMP=1769573928/*!*/;
BEGIN
/*!*/;
# at 3135
#260128 13:18:48 server id 1  end_log_pos 3294 CRC32 0x561cfa43 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 3294
#260128 13:18:48 server id 1  end_log_pos 3934 CRC32 0x191adfa8 	Update_rows: table id 103 flags: STMT_END_F
### UPDATE `crm_ai_web`.`afterservice`
### WHERE
###   @1='cmkxim0u100025z7hxqpr178o'
###   @2='AS-20260128-001'
###   @3='AS-20260128-001'
###   @4='cmkxim0tt00005z7htm9x1j3p'
###   @5=NULL
###   @6='?대???
###   @7='REPAIR'
###   @8='NOISE'
###   @9='AS'
###   @10='NORMAL'
###   @11='???뚯쓬 - ?섎━鍮?2留뚯썝 ?덈궡??
###   @12='??
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:18:21.239'
###   @19='2026-01-28 04:18:21.242'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:18:21.242'
###   @24='2026-01-28 04:18:35.136'
###   @25=''
###   @26=''
###   @27='遺?곗떆 ?숇옒援?李⑤강怨⑤줈 24 ?꾩씠?덉뒪 501??
###   @28='010-3859-6284'
###   @29=NULL
###   @30='2026-01-28 00:00:00.000'
###   @31=NULL
###   @32=NULL
###   @33=''
###   @34=NULL
###   @35=''
### SET
###   @1='cmkxim0u100025z7hxqpr178o'
###   @2='AS-20260128-001'
###   @3='AS-20260128-001'
###   @4='cmkxim0tt00005z7htm9x1j3p'
###   @5=NULL
###   @6='?대???
###   @7='REPAIR'
###   @8='NOISE'
###   @9='AS'
###   @10='NORMAL'
###   @11='???뚯쓬 - ?섎━鍮?2留뚯썝 ?덈궡??
###   @12='??
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:18:21.239'
###   @19='2026-01-28 04:18:21.242'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:18:21.242'
###   @24='2026-01-28 04:18:48.385'
###   @25='蹂몄궗'
###   @26=''
###   @27='遺?곗떆 ?숇옒援?李⑤강怨⑤줈 24 ?꾩씠?덉뒪 501??
###   @28='010-3859-6284'
###   @29=NULL
###   @30='2026-01-28 00:00:00.000'
###   @31=NULL
###   @32=NULL
###   @33=''
###   @34=NULL
###   @35=''
# at 3934
#260128 13:18:48 server id 1  end_log_pos 3965 CRC32 0x9924cdea 	Xid = 1435
COMMIT/*!*/;
# at 3965
#260128 13:24:37 server id 1  end_log_pos 4044 CRC32 0xeacbedb5 	Anonymous_GTID	last_committed=5	sequence_number=6	rbr_
only=yes	original_committed_timestamp=1769574277250922	immediate_commit_timestamp=1769574277250922	transaction_length=1
329
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769574277250922 (2026-01-28 13:24:37.250922 대한민국 표준시)
# immediate_commit_timestamp=1769574277250922 (2026-01-28 13:24:37.250922 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769574277250922*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 4044
#260128 13:24:37 server id 1  end_log_pos 4142 CRC32 0x524ab057 	Query	thread_id=74	exec_time=0	error_code=0
SET TIMESTAMP=1769574277/*!*/;
BEGIN
/*!*/;
# at 4142
#260128 13:24:37 server id 1  end_log_pos 4301 CRC32 0xd294dab2 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 4301
#260128 13:24:37 server id 1  end_log_pos 5263 CRC32 0xf9acd155 	Update_rows: table id 103 flags: STMT_END_F
### UPDATE `crm_ai_web`.`afterservice`
### WHERE
###   @1='cmkqiqfzz0222o40sjdpar3wo'
###   @2='AS-20260123-002'
###   @3='AS-20260123-002'
###   @4='cmkqiqfzr0220o40s52o9cxgy'
###   @5=NULL
###   @6='?⑹쑄誘?
###   @7='REPAIR'
###   @8='NOISE'
###   @9='AS'
###   @10='NORMAL'
###   @11='湲곌린?먯꽌 ?뚯쓬 諛쒖깮(鍮④컙??遺덈튆?먯꽌留??뚯쓬??諛쒖깮?섏? ?딆쓬)'
###   @12='?대뱶3'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-23 06:47:24.285'
###   @19='2026-01-23 06:47:24.287'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-23 06:47:24.287'
###   @24='2026-01-27 07:13:12.118'
###   @25='洹몃줈??
###   @26=''
###   @27='寃쎄린??愿묒＜???쒖꽦濡?5 ?쒖쟾?먯뒪?뚯씠??1501??902??
###   @28='010-3796-7463'
###   @29='2026-01-27 00:00:00.000'
###   @30='2026-01-23 00:00:00.000'
###   @31=NULL
###   @32='2023-09-25 00:00:00.000'
###   @33='?щえ??援먯껜. ?대?泥?냼?꾨즺. 洹몃줈?몄뿉 25,000??泥?뎄.'
###   @34=NULL
###   @35=''
### SET
###   @1='cmkqiqfzz0222o40sjdpar3wo'
###   @2='AS-20260123-002'
###   @3='AS-20260123-002'
###   @4='cmkqiqfzr0220o40s52o9cxgy'
###   @5=NULL
###   @6='?⑹쑄誘?
###   @7='REPAIR'
###   @8='NOISE'
###   @9='AS'
###   @10='NORMAL'
###   @11='湲곌린?먯꽌 ?뚯쓬 諛쒖깮(鍮④컙??遺덈튆?먯꽌留??뚯쓬??諛쒖깮?섏? ?딆쓬)'
###   @12='?대뱶3'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-23 06:47:24.285'
###   @19='2026-01-23 06:47:24.287'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-23 06:47:24.287'
###   @24='2026-01-28 04:24:37.246'
###   @25='洹몃줈??
###   @26=''
###   @27='寃쎄린??愿묒＜???쒖꽦濡?5 ?쒖쟾?먯뒪?뚯씠??1501??902??
###   @28='010-3796-7463'
###   @29='2026-01-27 00:00:00.000'
###   @30='2026-01-23 00:00:00.000'
###   @31='2026-01-28 00:00:00.000'
###   @32='2023-09-25 00:00:00.000'
###   @33='?щえ??援먯껜. ?대?泥?냼?꾨즺. 洹몃줈?몄뿉 25,000??泥?뎄.'
###   @34='2026-01-28 00:00:00.000'
###   @35='461466043393'
# at 5263
#260128 13:24:37 server id 1  end_log_pos 5294 CRC32 0x9576898b 	Xid = 1452
COMMIT/*!*/;
# at 5294
#260128 13:34:40 server id 1  end_log_pos 5373 CRC32 0x0fcf4786 	Anonymous_GTID	last_committed=6	sequence_number=7	rbr_
only=yes	original_committed_timestamp=1769574880108398	immediate_commit_timestamp=1769574880108398	transaction_length=4
44
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769574880108398 (2026-01-28 13:34:40.108398 대한민국 표준시)
# immediate_commit_timestamp=1769574880108398 (2026-01-28 13:34:40.108398 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769574880108398*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 5373
#260128 13:34:40 server id 1  end_log_pos 5464 CRC32 0x6e1681b0 	Query	thread_id=75	exec_time=0	error_code=0
SET TIMESTAMP=1769574880/*!*/;
BEGIN
/*!*/;
# at 5464
#260128 13:34:40 server id 1  end_log_pos 5558 CRC32 0xe7ac4349 	Table_map: `crm_ai_web`.`customer` mapped to number 11
0
# has_generated_invisible_primary_key=0
# at 5558
#260128 13:34:40 server id 1  end_log_pos 5707 CRC32 0xe57ef3db 	Write_rows: table id 110 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`customer`
### SET
###   @1='cmkxj704q00035z7hg5br0t7h'
###   @2='?뺤???
###   @3='010-2570-1521@temp.com'
###   @4='010-2570-1521'
###   @5=NULL
###   @6='ACTIVE'
###   @7=NULL
###   @8='NORMAL'
###   @9=0
###   @10=NULL
###   @11='2026-01-28 04:34:40.106'
###   @12='2026-01-28 04:34:40.106'
# at 5707
#260128 13:34:40 server id 1  end_log_pos 5738 CRC32 0x254024a4 	Xid = 1483
COMMIT/*!*/;
# at 5738
#260128 13:34:40 server id 1  end_log_pos 5817 CRC32 0x7f7695d3 	Anonymous_GTID	last_committed=7	sequence_number=8	rbr_
only=yes	original_committed_timestamp=1769574880112367	immediate_commit_timestamp=1769574880112367	transaction_length=7
62
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769574880112367 (2026-01-28 13:34:40.112367 대한민국 표준시)
# immediate_commit_timestamp=1769574880112367 (2026-01-28 13:34:40.112367 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769574880112367*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 5817
#260128 13:34:40 server id 1  end_log_pos 5906 CRC32 0xff425a09 	Query	thread_id=75	exec_time=0	error_code=0
SET TIMESTAMP=1769574880/*!*/;
BEGIN
/*!*/;
# at 5906
#260128 13:34:40 server id 1  end_log_pos 6065 CRC32 0x6cdf13c4 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 6065
#260128 13:34:40 server id 1  end_log_pos 6469 CRC32 0x1fa1f2b7 	Write_rows: table id 103 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`afterservice`
### SET
###   @1='cmkxj704u00055z7hneamhm2q'
###   @2='AS-20260128-002'
###   @3='AS-20260128-002'
###   @4='cmkxj704q00035z7hg5br0t7h'
###   @5=NULL
###   @6='?뺤???
###   @7='REPAIR'
###   @8='OTHER'
###   @9='RECEIVED'
###   @10='NORMAL'
###   @11='異⑹쟾???섏??딆쑝硫? 異⑹쟾???곌껐?먮룄 諛섏쓳???놁뒿?덈떎.'
###   @12='??'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:34:40.104'
###   @19='2026-01-28 04:34:40.110'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:34:40.110'
###   @24='2026-01-28 04:34:40.110'
###   @25='洹몃줈??
###   @26=''
###   @27='寃쎈궓 吏꾩＜??異⑹쓽濡?146(以묓씎 S?대옒???뷀띁?ㅽ듃) 605??602??
###   @28='010-2570-1521'
###   @29=NULL
###   @30=NULL
###   @31=NULL
###   @32='2024-06-30 00:00:00.000'
###   @33=''
###   @34=NULL
###   @35=''
# at 6469
#260128 13:34:40 server id 1  end_log_pos 6500 CRC32 0x66f58e8f 	Xid = 1491
COMMIT/*!*/;
# at 6500
#260128 13:34:59 server id 1  end_log_pos 6579 CRC32 0x22c5c01d 	Anonymous_GTID	last_committed=8	sequence_number=9	rbr_
only=yes	original_committed_timestamp=1769574899455610	immediate_commit_timestamp=1769574899455610	transaction_length=1
142
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769574899455610 (2026-01-28 13:34:59.455610 대한민국 표준시)
# immediate_commit_timestamp=1769574899455610 (2026-01-28 13:34:59.455610 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769574899455610*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 6579
#260128 13:34:59 server id 1  end_log_pos 6677 CRC32 0x43b599f6 	Query	thread_id=75	exec_time=0	error_code=0
SET TIMESTAMP=1769574899/*!*/;
BEGIN
/*!*/;
# at 6677
#260128 13:34:59 server id 1  end_log_pos 6836 CRC32 0x0ec434b5 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 6836
#260128 13:34:59 server id 1  end_log_pos 7611 CRC32 0xcf8d297c 	Update_rows: table id 103 flags: STMT_END_F
### UPDATE `crm_ai_web`.`afterservice`
### WHERE
###   @1='cmkxj704u00055z7hneamhm2q'
###   @2='AS-20260128-002'
###   @3='AS-20260128-002'
###   @4='cmkxj704q00035z7hg5br0t7h'
###   @5=NULL
###   @6='?뺤???
###   @7='REPAIR'
###   @8='OTHER'
###   @9='RECEIVED'
###   @10='NORMAL'
###   @11='異⑹쟾???섏??딆쑝硫? 異⑹쟾???곌껐?먮룄 諛섏쓳???놁뒿?덈떎.'
###   @12='??'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:34:40.104'
###   @19='2026-01-28 04:34:40.110'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:34:40.110'
###   @24='2026-01-28 04:34:40.110'
###   @25='洹몃줈??
###   @26=''
###   @27='寃쎈궓 吏꾩＜??異⑹쓽濡?146(以묓씎 S?대옒???뷀띁?ㅽ듃) 605??602??
###   @28='010-2570-1521'
###   @29=NULL
###   @30=NULL
###   @31=NULL
###   @32='2024-06-30 00:00:00.000'
###   @33=''
###   @34=NULL
###   @35=''
### SET
###   @1='cmkxj704u00055z7hneamhm2q'
###   @2='AS-20260128-002'
###   @3='AS-20260128-002'
###   @4='cmkxj704q00035z7hg5br0t7h'
###   @5=NULL
###   @6='?뺤???
###   @7='REPAIR'
###   @8='OTHER'
###   @9='AS'
###   @10='NORMAL'
###   @11='異⑹쟾???섏??딆쑝硫? 異⑹쟾???곌껐?먮룄 諛섏쓳???놁뒿?덈떎.'
###   @12='??'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 04:34:40.104'
###   @19='2026-01-28 04:34:40.110'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 04:34:40.110'
###   @24='2026-01-28 04:34:59.450'
###   @25='洹몃줈??
###   @26=''
###   @27='寃쎈궓 吏꾩＜??異⑹쓽濡?146(以묓씎 S?대옒???뷀띁?ㅽ듃) 605??602??
###   @28='010-2570-1521'
###   @29='2026-01-28 00:00:00.000'
###   @30=NULL
###   @31=NULL
###   @32='2024-06-30 00:00:00.000'
###   @33=''
###   @34=NULL
###   @35=''
# at 7611
#260128 13:34:59 server id 1  end_log_pos 7642 CRC32 0xff3d8916 	Xid = 1503
COMMIT/*!*/;
# at 7642
#260128 16:43:29 server id 1  end_log_pos 7721 CRC32 0x01ef6834 	Anonymous_GTID	last_committed=9	sequence_number=10	rbr
_only=yes	original_committed_timestamp=1769586209513952	immediate_commit_timestamp=1769586209513952	transaction_length=
780
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769586209513952 (2026-01-28 16:43:29.513952 대한민국 표준시)
# immediate_commit_timestamp=1769586209513952 (2026-01-28 16:43:29.513952 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769586209513952*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 7721
#260128 16:43:29 server id 1  end_log_pos 7810 CRC32 0x4bee1ee8 	Query	thread_id=95	exec_time=0	error_code=0
SET TIMESTAMP=1769586209/*!*/;
BEGIN
/*!*/;
# at 7810
#260128 16:43:29 server id 1  end_log_pos 7969 CRC32 0xcdb97223 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 7969
#260128 16:43:29 server id 1  end_log_pos 8391 CRC32 0x5316d98f 	Write_rows: table id 103 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`afterservice`
### SET
###   @1='cmkxpxtye00075z7hmjvdu4gg'
###   @2='AS-20260128-003'
###   @3='AS-20260128-003'
###   @4='cmkuuwdyn0dzno40syrurdl54'
###   @5=NULL
###   @6='?댁쥌誘?
###   @7='REPAIR'
###   @8='OTHER'
###   @9='RECEIVED'
###   @10='NORMAL'
###   @11='led?????ㅼ뼱?ㅻ굹 ?뚯븘媛???뚮━媛 ?ㅻ━吏 ?딆쓬'
###   @12='??'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 07:43:29.508'
###   @19='2026-01-28 07:43:29.510'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 07:43:29.510'
###   @24='2026-01-28 07:43:29.510'
###   @25='?댄뵾?ъ쫰'
###   @26=''
###   @27='寃쎄린??源?ъ떆 ?띾Т濡?9踰덇만 51 (?띾Т?? ?밴끝留덉쓣?붾뱶硫붾Ⅴ?붿븰?꾪뙆?? 327-104'
###   @28='010-3675-4754'
###   @29=NULL
###   @30=NULL
###   @31=NULL
###   @32='2025-12-18 00:00:00.000'
###   @33=''
###   @34=NULL
###   @35=''
# at 8391
#260128 16:43:29 server id 1  end_log_pos 8422 CRC32 0x6f335ac5 	Xid = 1835
COMMIT/*!*/;
# at 8422
#260128 16:43:41 server id 1  end_log_pos 8501 CRC32 0xebb96d73 	Anonymous_GTID	last_committed=10	sequence_number=11	rb
r_only=yes	original_committed_timestamp=1769586221194918	immediate_commit_timestamp=1769586221194918	transaction_length
=1178
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769586221194918 (2026-01-28 16:43:41.194918 대한민국 표준시)
# immediate_commit_timestamp=1769586221194918 (2026-01-28 16:43:41.194918 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769586221194918*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 8501
#260128 16:43:41 server id 1  end_log_pos 8599 CRC32 0xe5f7414a 	Query	thread_id=95	exec_time=0	error_code=0
SET TIMESTAMP=1769586221/*!*/;
BEGIN
/*!*/;
# at 8599
#260128 16:43:41 server id 1  end_log_pos 8758 CRC32 0x0d7663ae 	Table_map: `crm_ai_web`.`afterservice` mapped to numbe
r 103
# has_generated_invisible_primary_key=0
# at 8758
#260128 16:43:41 server id 1  end_log_pos 9569 CRC32 0xbbe68afc 	Update_rows: table id 103 flags: STMT_END_F
### UPDATE `crm_ai_web`.`afterservice`
### WHERE
###   @1='cmkxpxtye00075z7hmjvdu4gg'
###   @2='AS-20260128-003'
###   @3='AS-20260128-003'
###   @4='cmkuuwdyn0dzno40syrurdl54'
###   @5=NULL
###   @6='?댁쥌誘?
###   @7='REPAIR'
###   @8='OTHER'
###   @9='RECEIVED'
###   @10='NORMAL'
###   @11='led?????ㅼ뼱?ㅻ굹 ?뚯븘媛???뚮━媛 ?ㅻ━吏 ?딆쓬'
###   @12='??'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 07:43:29.508'
###   @19='2026-01-28 07:43:29.510'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 07:43:29.510'
###   @24='2026-01-28 07:43:29.510'
###   @25='?댄뵾?ъ쫰'
###   @26=''
###   @27='寃쎄린??源?ъ떆 ?띾Т濡?9踰덇만 51 (?띾Т?? ?밴끝留덉쓣?붾뱶硫붾Ⅴ?붿븰?꾪뙆?? 327-104'
###   @28='010-3675-4754'
###   @29=NULL
###   @30=NULL
###   @31=NULL
###   @32='2025-12-18 00:00:00.000'
###   @33=''
###   @34=NULL
###   @35=''
### SET
###   @1='cmkxpxtye00075z7hmjvdu4gg'
###   @2='AS-20260128-003'
###   @3='AS-20260128-003'
###   @4='cmkuuwdyn0dzno40syrurdl54'
###   @5=NULL
###   @6='?댁쥌誘?
###   @7='REPAIR'
###   @8='OTHER'
###   @9='AS'
###   @10='NORMAL'
###   @11='led?????ㅼ뼱?ㅻ굹 ?뚯븘媛???뚮━媛 ?ㅻ━吏 ?딆쓬'
###   @12='??'
###   @13=''
###   @14=NULL
###   @15=NULL
###   @16=NULL
###   @17=NULL
###   @18='2026-01-28 07:43:29.508'
###   @19='2026-01-28 07:43:29.510'
###   @20=NULL
###   @21=NULL
###   @22=NULL
###   @23='2026-01-28 07:43:29.510'
###   @24='2026-01-28 07:43:41.190'
###   @25='?댄뵾?ъ쫰'
###   @26=''
###   @27='寃쎄린??源?ъ떆 ?띾Т濡?9踰덇만 51 (?띾Т?? ?밴끝留덉쓣?붾뱶硫붾Ⅴ?붿븰?꾪뙆?? 327-104'
###   @28='010-3675-4754'
###   @29=NULL
###   @30='2026-01-28 00:00:00.000'
###   @31=NULL
###   @32='2025-12-18 00:00:00.000'
###   @33=''
###   @34=NULL
###   @35=''
# at 9569
#260128 16:43:41 server id 1  end_log_pos 9600 CRC32 0x8ed4b4e2 	Xid = 1847
COMMIT/*!*/;
# at 9600
#260128 20:17:53 server id 1  end_log_pos 9679 CRC32 0x7cf7dbc4 	Anonymous_GTID	last_committed=11	sequence_number=12	rb
r_only=yes	original_committed_timestamp=1769599073542081	immediate_commit_timestamp=1769599073542081	transaction_length
=662
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769599073542081 (2026-01-28 20:17:53.542081 대한민국 표준시)
# immediate_commit_timestamp=1769599073542081 (2026-01-28 20:17:53.542081 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769599073542081*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 9679
#260128 20:17:53 server id 1  end_log_pos 9770 CRC32 0x29da7649 	Query	thread_id=105	exec_time=0	error_code=0
SET TIMESTAMP=1769599073/*!*/;
BEGIN
/*!*/;
# at 9770
#260128 20:17:53 server id 1  end_log_pos 9934 CRC32 0xeeedbfec 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 9934
#260128 20:17:53 server id 1  end_log_pos 10231 CRC32 0x1955ca3e 	Write_rows: table id 114 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`order`
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:17:53.539'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 10231
#260128 20:17:53 server id 1  end_log_pos 10262 CRC32 0x0b3d55ca 	Xid = 2159
COMMIT/*!*/;
# at 10262
#260128 20:19:06 server id 1  end_log_pos 10341 CRC32 0xa250ca45 	Anonymous_GTID	last_committed=12	sequence_number=13	r
br_only=yes	original_committed_timestamp=1769599146518030	immediate_commit_timestamp=1769599146518030	transaction_lengt
h=934
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769599146518030 (2026-01-28 20:19:06.518030 대한민국 표준시)
# immediate_commit_timestamp=1769599146518030 (2026-01-28 20:19:06.518030 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769599146518030*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 10341
#260128 20:19:06 server id 1  end_log_pos 10441 CRC32 0x9c1c0f55 	Query	thread_id=105	exec_time=0	error_code=0
SET TIMESTAMP=1769599146/*!*/;
BEGIN
/*!*/;
# at 10441
#260128 20:19:06 server id 1  end_log_pos 10605 CRC32 0xc1c5319c 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 10605
#260128 20:19:06 server id 1  end_log_pos 11165 CRC32 0x786819a8 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:17:53.539'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:19:06.514'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
# at 11165
#260128 20:19:06 server id 1  end_log_pos 11196 CRC32 0xce172810 	Xid = 2215
COMMIT/*!*/;
# at 11196
#260128 20:58:14 server id 1  end_log_pos 11275 CRC32 0x14132ed1 	Anonymous_GTID	last_committed=13	sequence_number=14	r
br_only=yes	original_committed_timestamp=1769601494800511	immediate_commit_timestamp=1769601494800511	transaction_lengt
h=939
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601494800511 (2026-01-28 20:58:14.800511 대한민국 표준시)
# immediate_commit_timestamp=1769601494800511 (2026-01-28 20:58:14.800511 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601494800511*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 11275
#260128 20:58:14 server id 1  end_log_pos 11375 CRC32 0xc7cc9caf 	Query	thread_id=106	exec_time=0	error_code=0
SET TIMESTAMP=1769601494/*!*/;
BEGIN
/*!*/;
# at 11375
#260128 20:58:14 server id 1  end_log_pos 11539 CRC32 0x548bb395 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 11539
#260128 20:58:14 server id 1  end_log_pos 12104 CRC32 0x3c17d5d9 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:19:06.514'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:14.796'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
# at 12104
#260128 20:58:14 server id 1  end_log_pos 12135 CRC32 0xd4ddac14 	Xid = 2262
COMMIT/*!*/;
# at 12135
#260128 20:58:19 server id 1  end_log_pos 12214 CRC32 0x0ec62118 	Anonymous_GTID	last_committed=14	sequence_number=15	r
br_only=yes	original_committed_timestamp=1769601499640054	immediate_commit_timestamp=1769601499640054	transaction_lengt
h=944
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601499640054 (2026-01-28 20:58:19.640054 대한민국 표준시)
# immediate_commit_timestamp=1769601499640054 (2026-01-28 20:58:19.640054 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601499640054*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 12214
#260128 20:58:19 server id 1  end_log_pos 12314 CRC32 0x216a8535 	Query	thread_id=106	exec_time=0	error_code=0
SET TIMESTAMP=1769601499/*!*/;
BEGIN
/*!*/;
# at 12314
#260128 20:58:19 server id 1  end_log_pos 12478 CRC32 0x83433883 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 12478
#260128 20:58:19 server id 1  end_log_pos 13048 CRC32 0x12bd9af7 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:14.796'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:19.636'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
# at 13048
#260128 20:58:19 server id 1  end_log_pos 13079 CRC32 0xdcc7fb79 	Xid = 2274
COMMIT/*!*/;
# at 13079
#260128 20:58:30 server id 1  end_log_pos 13158 CRC32 0x92aeda58 	Anonymous_GTID	last_committed=15	sequence_number=16	r
br_only=yes	original_committed_timestamp=1769601510176133	immediate_commit_timestamp=1769601510176133	transaction_lengt
h=944
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601510176133 (2026-01-28 20:58:30.176133 대한민국 표준시)
# immediate_commit_timestamp=1769601510176133 (2026-01-28 20:58:30.176133 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601510176133*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 13158
#260128 20:58:30 server id 1  end_log_pos 13258 CRC32 0x2cc143ba 	Query	thread_id=106	exec_time=0	error_code=0
SET TIMESTAMP=1769601510/*!*/;
BEGIN
/*!*/;
# at 13258
#260128 20:58:30 server id 1  end_log_pos 13422 CRC32 0x6b7fe2a6 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 13422
#260128 20:58:30 server id 1  end_log_pos 13992 CRC32 0xf0faebc6 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:19.636'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:30.172'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 13992
#260128 20:58:30 server id 1  end_log_pos 14023 CRC32 0x328f05e7 	Xid = 2313
COMMIT/*!*/;
# at 14023
#260128 20:58:30 server id 1  end_log_pos 14102 CRC32 0xbb9ae365 	Anonymous_GTID	last_committed=16	sequence_number=17	r
br_only=yes	original_committed_timestamp=1769601510817966	immediate_commit_timestamp=1769601510817966	transaction_lengt
h=944
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601510817966 (2026-01-28 20:58:30.817966 대한민국 표준시)
# immediate_commit_timestamp=1769601510817966 (2026-01-28 20:58:30.817966 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601510817966*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 14102
#260128 20:58:30 server id 1  end_log_pos 14202 CRC32 0xb6b4fe0b 	Query	thread_id=109	exec_time=0	error_code=0
SET TIMESTAMP=1769601510/*!*/;
BEGIN
/*!*/;
# at 14202
#260128 20:58:30 server id 1  end_log_pos 14366 CRC32 0x23e63d6b 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 14366
#260128 20:58:30 server id 1  end_log_pos 14936 CRC32 0x507418c0 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:30.172'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:30.814'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
# at 14936
#260128 20:58:30 server id 1  end_log_pos 14967 CRC32 0x6c6c672e 	Xid = 2343
COMMIT/*!*/;
# at 14967
#260128 20:58:33 server id 1  end_log_pos 15046 CRC32 0x66aa3e68 	Anonymous_GTID	last_committed=17	sequence_number=18	r
br_only=yes	original_committed_timestamp=1769601513537071	immediate_commit_timestamp=1769601513537071	transaction_lengt
h=944
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601513537071 (2026-01-28 20:58:33.537071 대한민국 표준시)
# immediate_commit_timestamp=1769601513537071 (2026-01-28 20:58:33.537071 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601513537071*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 15046
#260128 20:58:33 server id 1  end_log_pos 15146 CRC32 0x2ce10696 	Query	thread_id=107	exec_time=0	error_code=0
SET TIMESTAMP=1769601513/*!*/;
BEGIN
/*!*/;
# at 15146
#260128 20:58:33 server id 1  end_log_pos 15310 CRC32 0xcdc5ec39 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 15310
#260128 20:58:33 server id 1  end_log_pos 15880 CRC32 0xc46fea47 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:30.814'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:33.533'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 15880
#260128 20:58:33 server id 1  end_log_pos 15911 CRC32 0x542dedb9 	Xid = 2382
COMMIT/*!*/;
# at 15911
#260128 20:58:36 server id 1  end_log_pos 15990 CRC32 0x7ffc4229 	Anonymous_GTID	last_committed=18	sequence_number=19	r
br_only=yes	original_committed_timestamp=1769601516270090	immediate_commit_timestamp=1769601516270090	transaction_lengt
h=944
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601516270090 (2026-01-28 20:58:36.270090 대한민국 표준시)
# immediate_commit_timestamp=1769601516270090 (2026-01-28 20:58:36.270090 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601516270090*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 15990
#260128 20:58:36 server id 1  end_log_pos 16090 CRC32 0x76206d9e 	Query	thread_id=110	exec_time=0	error_code=0
SET TIMESTAMP=1769601516/*!*/;
BEGIN
/*!*/;
# at 16090
#260128 20:58:36 server id 1  end_log_pos 16254 CRC32 0x3569ec3d 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 16254
#260128 20:58:36 server id 1  end_log_pos 16824 CRC32 0x1d7c46a3 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:33.533'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:36.266'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
# at 16824
#260128 20:58:36 server id 1  end_log_pos 16855 CRC32 0x7d1a2e99 	Xid = 2418
COMMIT/*!*/;
# at 16855
#260128 20:58:38 server id 1  end_log_pos 16934 CRC32 0x30995408 	Anonymous_GTID	last_committed=19	sequence_number=20	r
br_only=yes	original_committed_timestamp=1769601518044057	immediate_commit_timestamp=1769601518044057	transaction_lengt
h=944
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601518044057 (2026-01-28 20:58:38.044057 대한민국 표준시)
# immediate_commit_timestamp=1769601518044057 (2026-01-28 20:58:38.044057 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601518044057*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 16934
#260128 20:58:38 server id 1  end_log_pos 17034 CRC32 0xe64ee535 	Query	thread_id=108	exec_time=0	error_code=0
SET TIMESTAMP=1769601518/*!*/;
BEGIN
/*!*/;
# at 17034
#260128 20:58:38 server id 1  end_log_pos 17198 CRC32 0x24d9791c 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 17198
#260128 20:58:38 server id 1  end_log_pos 17768 CRC32 0x7e11cf3b 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:36.266'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=1
### SET
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:38.041'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 17768
#260128 20:58:38 server id 1  end_log_pos 17799 CRC32 0x402a928b 	Xid = 2454
COMMIT/*!*/;
# at 17799
#260128 20:58:44 server id 1  end_log_pos 17878 CRC32 0xabd88a86 	Anonymous_GTID	last_committed=20	sequence_number=21	r
br_only=yes	original_committed_timestamp=1769601524089611	immediate_commit_timestamp=1769601524089611	transaction_lengt
h=1442
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601524089611 (2026-01-28 20:58:44.089611 대한민국 표준시)
# immediate_commit_timestamp=1769601524089611 (2026-01-28 20:58:44.089611 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601524089611*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 17878
#260128 20:58:44 server id 1  end_log_pos 17967 CRC32 0x08dd785e 	Query	thread_id=106	exec_time=0	error_code=0
SET TIMESTAMP=1769601524/*!*/;
BEGIN
/*!*/;
# at 17967
#260128 20:58:44 server id 1  end_log_pos 18055 CRC32 0x51dc9ba9 	Table_map: `crm_ai_web`.`trashbin` mapped to number 1
13
# has_generated_invisible_primary_key=0
# at 18055
#260128 20:58:44 server id 1  end_log_pos 19210 CRC32 0x68d2e796 	Write_rows: table id 113 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`trashbin`
### SET
###   @1='cmkxz22ra000a5z7hb18mx7uh'
###   @2='cmkxxljwi00095z7hywtqs0i5'
###   @3='Order'
###   @4='{"id": "cmkxxljwi00095z7hywtqs0i5", "memo": null, "items": [], "notes": null, "status": "SHIPPED", "courier":
 "CJ", "partner": null, "giftSent": false, "quantity": 1, "basePrice": "1000000", "createdAt": "2026-01-28T11:17:53.539
Z", "orderDate": "2026-01-28T00:00:00.000Z", "staffName": null, "updatedAt": "2026-01-28T11:58:38.041Z", "customerId": 
"cmkb4qu3x000dpawc76qb55wj", "giftOption": null, "deliveryMsg": "臾몄븵???붿＜?몄슂", "orderNumber": "ORD-2024-001", "orderSou
rce": "?댄뵾?ъ쫰", "ordererName": null, "productInfo": "?대뱶4", "productName": null, "shippingFee": "3000", "totalAmount": 
"1003000", "contactPhone": null, "customerName": null, "shippingAddr": null, "additionalFee": null, "customerEmail": nu
ll, "customerPhone": null, "recipientAddr": "?쒖슱??媛뺣궓援??뚰뿤?濡?123", "recipientName": "?띻만??, "customerMobile": null, "r
ecipientPhone": "02-1234-5679", "shippingMethod": null, "shippingStatus": null, "trackingNumber": "123", "recipientMobi
le": "02-1234-5679", "recipientZipCode": "12345"}'
###   @5=NULL
###   @6=NULL
###   @7=NULL
###   @8='ORD-2024-001'
###   @9='?띻만??| ?대뱶4 | ??,003,000'
###   @10='2026-02-27 11:58:44.084'
###   @11='2026-01-28 11:58:44.086'
# at 19210
#260128 20:58:44 server id 1  end_log_pos 19241 CRC32 0x5ef86726 	Xid = 2489
COMMIT/*!*/;
# at 19241
#260128 20:58:44 server id 1  end_log_pos 19320 CRC32 0x951df348 	Anonymous_GTID	last_committed=21	sequence_number=22	r
br_only=yes	original_committed_timestamp=1769601524093844	immediate_commit_timestamp=1769601524093844	transaction_lengt
h=659
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601524093844 (2026-01-28 20:58:44.093844 대한민국 표준시)
# immediate_commit_timestamp=1769601524093844 (2026-01-28 20:58:44.093844 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601524093844*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 19320
#260128 20:58:44 server id 1  end_log_pos 19403 CRC32 0x88ea727b 	Query	thread_id=106	exec_time=0	error_code=0
SET TIMESTAMP=1769601524/*!*/;
BEGIN
/*!*/;
# at 19403
#260128 20:58:44 server id 1  end_log_pos 19567 CRC32 0xdf3aa3c2 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 19567
#260128 20:58:44 server id 1  end_log_pos 19869 CRC32 0x02dca25b 	Delete_rows: table id 114 flags: STMT_END_F
### DELETE FROM `crm_ai_web`.`order`
### WHERE
###   @1='cmkxxljwi00095z7hywtqs0i5'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='123'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:17:53.539'
###   @29='2026-01-28 11:58:38.041'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 19869
#260128 20:58:44 server id 1  end_log_pos 19900 CRC32 0x95ba0c01 	Xid = 2494
COMMIT/*!*/;
# at 19900
#260128 20:59:53 server id 1  end_log_pos 19979 CRC32 0x7c458553 	Anonymous_GTID	last_committed=22	sequence_number=23	r
br_only=yes	original_committed_timestamp=1769601593552000	immediate_commit_timestamp=1769601593552000	transaction_lengt
h=662
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601593552000 (2026-01-28 20:59:53.552000 대한민국 표준시)
# immediate_commit_timestamp=1769601593552000 (2026-01-28 20:59:53.552000 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601593552000*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 19979
#260128 20:59:53 server id 1  end_log_pos 20070 CRC32 0xd499f78f 	Query	thread_id=107	exec_time=0	error_code=0
SET TIMESTAMP=1769601593/*!*/;
BEGIN
/*!*/;
# at 20070
#260128 20:59:53 server id 1  end_log_pos 20234 CRC32 0x226b6b1c 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 20234
#260128 20:59:53 server id 1  end_log_pos 20531 CRC32 0xd1f51fa7 	Write_rows: table id 114 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`order`
### SET
###   @1='cmkxz3kcu000c5z7h0odo4wrb'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:59:53.550'
###   @29='2026-01-28 11:59:53.550'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 20531
#260128 20:59:53 server id 1  end_log_pos 20562 CRC32 0x38a5bcbe 	Xid = 2543
COMMIT/*!*/;
# at 20562
#260128 21:01:35 server id 1  end_log_pos 20641 CRC32 0x0f7b9393 	Anonymous_GTID	last_committed=23	sequence_number=24	r
br_only=yes	original_committed_timestamp=1769601695156875	immediate_commit_timestamp=1769601695156875	transaction_lengt
h=940
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601695156875 (2026-01-28 21:01:35.156875 대한민국 표준시)
# immediate_commit_timestamp=1769601695156875 (2026-01-28 21:01:35.156875 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601695156875*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 20641
#260128 21:01:35 server id 1  end_log_pos 20741 CRC32 0xd740afcf 	Query	thread_id=107	exec_time=0	error_code=0
SET TIMESTAMP=1769601695/*!*/;
BEGIN
/*!*/;
# at 20741
#260128 21:01:35 server id 1  end_log_pos 20905 CRC32 0x49e3c63e 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 20905
#260128 21:01:35 server id 1  end_log_pos 21471 CRC32 0xc7a84a4a 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxz3kcu000c5z7h0odo4wrb'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:59:53.550'
###   @29='2026-01-28 11:59:53.550'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
### SET
###   @1='cmkxz3kcu000c5z7h0odo4wrb'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='1234'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:59:53.550'
###   @29='2026-01-28 12:01:35.152'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 21471
#260128 21:01:35 server id 1  end_log_pos 21502 CRC32 0xf8efd055 	Xid = 2606
COMMIT/*!*/;
# at 21502
#260128 21:01:43 server id 1  end_log_pos 21581 CRC32 0x389d239e 	Anonymous_GTID	last_committed=24	sequence_number=25	r
br_only=yes	original_committed_timestamp=1769601703411393	immediate_commit_timestamp=1769601703411393	transaction_lengt
h=946
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601703411393 (2026-01-28 21:01:43.411393 대한민국 표준시)
# immediate_commit_timestamp=1769601703411393 (2026-01-28 21:01:43.411393 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601703411393*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 21581
#260128 21:01:43 server id 1  end_log_pos 21681 CRC32 0x874367ac 	Query	thread_id=107	exec_time=0	error_code=0
SET TIMESTAMP=1769601703/*!*/;
BEGIN
/*!*/;
# at 21681
#260128 21:01:43 server id 1  end_log_pos 21845 CRC32 0xffcdd3c2 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 21845
#260128 21:01:43 server id 1  end_log_pos 22417 CRC32 0xd3043240 	Update_rows: table id 114 flags: STMT_END_F
### UPDATE `crm_ai_web`.`order`
### WHERE
###   @1='cmkxz3kcu000c5z7h0odo4wrb'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='1234'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:59:53.550'
###   @29='2026-01-28 12:01:35.152'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
### SET
###   @1='cmkxz3kcu000c5z7h0odo4wrb'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='1234'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:59:53.550'
###   @29='2026-01-28 12:01:43.407'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 22417
#260128 21:01:43 server id 1  end_log_pos 22448 CRC32 0xe4150bf5 	Xid = 2617
COMMIT/*!*/;
# at 22448
#260128 21:01:56 server id 1  end_log_pos 22527 CRC32 0x755d8b63 	Anonymous_GTID	last_committed=25	sequence_number=26	r
br_only=yes	original_committed_timestamp=1769601716574729	immediate_commit_timestamp=1769601716574729	transaction_lengt
h=1443
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601716574729 (2026-01-28 21:01:56.574729 대한민국 표준시)
# immediate_commit_timestamp=1769601716574729 (2026-01-28 21:01:56.574729 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601716574729*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 22527
#260128 21:01:56 server id 1  end_log_pos 22616 CRC32 0x0b5f0ee8 	Query	thread_id=107	exec_time=0	error_code=0
SET TIMESTAMP=1769601716/*!*/;
BEGIN
/*!*/;
# at 22616
#260128 21:01:56 server id 1  end_log_pos 22704 CRC32 0x689f3f67 	Table_map: `crm_ai_web`.`trashbin` mapped to number 1
13
# has_generated_invisible_primary_key=0
# at 22704
#260128 21:01:56 server id 1  end_log_pos 23860 CRC32 0x1fd7ef15 	Write_rows: table id 113 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`trashbin`
### SET
###   @1='cmkxz67a3000d5z7hpyj4xajp'
###   @2='cmkxz3kcu000c5z7h0odo4wrb'
###   @3='Order'
###   @4='{"id": "cmkxz3kcu000c5z7h0odo4wrb", "memo": null, "items": [], "notes": null, "status": "SHIPPED", "courier":
 "CJ", "partner": null, "giftSent": false, "quantity": 1, "basePrice": "1000000", "createdAt": "2026-01-28T11:59:53.550
Z", "orderDate": "2026-01-28T00:00:00.000Z", "staffName": null, "updatedAt": "2026-01-28T12:01:43.407Z", "customerId": 
"cmkb4qu3x000dpawc76qb55wj", "giftOption": null, "deliveryMsg": "臾몄븵???붿＜?몄슂", "orderNumber": "ORD-2024-001", "orderSou
rce": "?댄뵾?ъ쫰", "ordererName": null, "productInfo": "?대뱶4", "productName": null, "shippingFee": "3000", "totalAmount": 
"1003000", "contactPhone": null, "customerName": null, "shippingAddr": null, "additionalFee": null, "customerEmail": nu
ll, "customerPhone": null, "recipientAddr": "?쒖슱??媛뺣궓援??뚰뿤?濡?123", "recipientName": "?띻만??, "customerMobile": null, "r
ecipientPhone": "02-1234-5679", "shippingMethod": null, "shippingStatus": null, "trackingNumber": "1234", "recipientMob
ile": "02-1234-5679", "recipientZipCode": "12345"}'
###   @5=NULL
###   @6=NULL
###   @7=NULL
###   @8='ORD-2024-001'
###   @9='?띻만??| ?대뱶4 | ??,003,000'
###   @10='2026-02-27 12:01:56.570'
###   @11='2026-01-28 12:01:56.572'
# at 23860
#260128 21:01:56 server id 1  end_log_pos 23891 CRC32 0x42ec48dc 	Xid = 2661
COMMIT/*!*/;
# at 23891
#260128 21:01:56 server id 1  end_log_pos 23970 CRC32 0x26cf0673 	Anonymous_GTID	last_committed=26	sequence_number=27	r
br_only=yes	original_committed_timestamp=1769601716578124	immediate_commit_timestamp=1769601716578124	transaction_lengt
h=660
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601716578124 (2026-01-28 21:01:56.578124 대한민국 표준시)
# immediate_commit_timestamp=1769601716578124 (2026-01-28 21:01:56.578124 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601716578124*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 23970
#260128 21:01:56 server id 1  end_log_pos 24053 CRC32 0x8201639a 	Query	thread_id=107	exec_time=0	error_code=0
SET TIMESTAMP=1769601716/*!*/;
BEGIN
/*!*/;
# at 24053
#260128 21:01:56 server id 1  end_log_pos 24217 CRC32 0xdef9e609 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 24217
#260128 21:01:56 server id 1  end_log_pos 24520 CRC32 0x087618d3 	Delete_rows: table id 114 flags: STMT_END_F
### DELETE FROM `crm_ai_web`.`order`
### WHERE
###   @1='cmkxz3kcu000c5z7h0odo4wrb'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='SHIPPED'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19='1234'
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 11:59:53.550'
###   @29='2026-01-28 12:01:43.407'
###   @30=NULL
###   @31='CJ'
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 24520
#260128 21:01:56 server id 1  end_log_pos 24551 CRC32 0xca99cb76 	Xid = 2666
COMMIT/*!*/;
# at 24551
#260128 21:02:35 server id 1  end_log_pos 24630 CRC32 0xcc945f5d 	Anonymous_GTID	last_committed=27	sequence_number=28	r
br_only=yes	original_committed_timestamp=1769601755617630	immediate_commit_timestamp=1769601755617630	transaction_lengt
h=662
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1769601755617630 (2026-01-28 21:02:35.617630 대한민국 표준시)
# immediate_commit_timestamp=1769601755617630 (2026-01-28 21:02:35.617630 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769601755617630*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 24630
#260128 21:02:35 server id 1  end_log_pos 24721 CRC32 0x4c2c8acb 	Query	thread_id=112	exec_time=0	error_code=0
SET TIMESTAMP=1769601755/*!*/;
BEGIN
/*!*/;
# at 24721
#260128 21:02:35 server id 1  end_log_pos 24885 CRC32 0xd1a21964 	Table_map: `crm_ai_web`.`order` mapped to number 114
# has_generated_invisible_primary_key=0
# at 24885
#260128 21:02:35 server id 1  end_log_pos 25182 CRC32 0xb1306d92 	Write_rows: table id 114 flags: STMT_END_F
### INSERT INTO `crm_ai_web`.`order`
### SET
###   @1='cmkxz71em0001sn9ljv3s82jw'
###   @2='ORD-2024-001'
###   @3='cmkb4qu3x000dpawc76qb55wj'
###   @4='2026-01-28 00:00:00.000'
###   @5=1003000.00
###   @6='PENDING'
###   @7='?댄뵾?ъ쫰'
###   @8='?대뱶4'
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=NULL
###   @13=NULL
###   @14=NULL
###   @15=3000.00
###   @16='?띻만??
###   @17='02-1234-5679'
###   @18=NULL
###   @19=''
###   @20=NULL
###   @21=1
###   @22=1000000.00
###   @23=NULL
###   @24=NULL
###   @25=NULL
###   @26=NULL
###   @27=NULL
###   @28='2026-01-28 12:02:35.614'
###   @29='2026-01-28 12:02:35.614'
###   @30=NULL
###   @31=''
###   @32='臾몄븵???붿＜?몄슂'
###   @33=NULL
###   @34=NULL
###   @35='?쒖슱??媛뺣궓援??뚰뿤?濡?123'
###   @36='02-1234-5679'
###   @37='12345'
###   @38=0
# at 25182
#260128 21:02:35 server id 1  end_log_pos 25213 CRC32 0xaa754fb6 	Xid = 2739
COMMIT/*!*/;
# at 25213
#260128 21:40:06 server id 1  end_log_pos 25292 CRC32 0x949b8f10 	Anonymous_GTID	last_committed=28	sequence_number=29	r
br_only=no	original_committed_timestamp=1769604006084980	immediate_commit_timestamp=1769604006084980	transaction_length
=1051
# original_commit_timestamp=1769604006084980 (2026-01-28 21:40:06.084980 대한민국 표준시)
# immediate_commit_timestamp=1769604006084980 (2026-01-28 21:40:06.084980 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604006084980*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 25292
#260128 21:40:06 server id 1  end_log_pos 26264 CRC32 0x9a511d2f 	Query	thread_id=115	exec_time=0	error_code=0	Xid = 78
27
use `crm_ai_web`/*!*/;
SET TIMESTAMP=1769604006/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `relatedId` VARCHAR(191) NULL,
    `relatedType` VARCHAR(191) NULL,
    `senderPartner` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NULL,
    `targetPartner` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_targetPartner_idx`(`targetPartner`),
    INDEX `Notification_targetUserId_idx`(`targetUserId`),
    INDEX `Notification_type_idx`(`type`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 26264
#260128 21:40:25 server id 1  end_log_pos 26341 CRC32 0xbcba0207 	Anonymous_GTID	last_committed=29	sequence_number=30	r
br_only=no	original_committed_timestamp=1769604026090525	immediate_commit_timestamp=1769604026090525	transaction_length
=201
# original_commit_timestamp=1769604026090525 (2026-01-28 21:40:26.090525 대한민국 표준시)
# immediate_commit_timestamp=1769604026090525 (2026-01-28 21:40:26.090525 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026090525*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 26341
#260128 21:40:25 server id 1  end_log_pos 26465 CRC32 0xa477fdf1 	Query	thread_id=119	exec_time=1	error_code=0	Xid = 78
62
SET TIMESTAMP=1769604025/*!*/;
DROP DATABASE `crm_ai_web`
/*!*/;
# at 26465
#260128 21:40:26 server id 1  end_log_pos 26542 CRC32 0xadca4f38 	Anonymous_GTID	last_committed=30	sequence_number=31	r
br_only=no	original_committed_timestamp=1769604026152029	immediate_commit_timestamp=1769604026152029	transaction_length
=205
# original_commit_timestamp=1769604026152029 (2026-01-28 21:40:26.152029 대한민국 표준시)
# immediate_commit_timestamp=1769604026152029 (2026-01-28 21:40:26.152029 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026152029*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 26542
#260128 21:40:26 server id 1  end_log_pos 26670 CRC32 0x8d921ac9 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
63
SET TIMESTAMP=1769604026/*!*/;
/*!80016 SET @@session.default_table_encryption=0*//*!*/;
CREATE DATABASE `crm_ai_web`
/*!*/;
# at 26670
#260128 21:40:26 server id 1  end_log_pos 26749 CRC32 0xacaa2aae 	Anonymous_GTID	last_committed=31	sequence_number=32	r
br_only=no	original_committed_timestamp=1769604026174675	immediate_commit_timestamp=1769604026174675	transaction_length
=1142
# original_commit_timestamp=1769604026174675 (2026-01-28 21:40:26.174675 대한민국 표준시)
# immediate_commit_timestamp=1769604026174675 (2026-01-28 21:40:26.174675 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026174675*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 26749
#260128 21:40:26 server id 1  end_log_pos 27812 CRC32 0x7259956e 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
79
use `crm_ai_web`/*!*/;
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `assignedPartner` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NULL,
    `passwordChangedAt` DATETIME(3) NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `maxChats` INTEGER NOT NULL DEFAULT 5,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_isActive_idx`(`isActive`),
    INDEX `User_assignedPartner_idx`(`assignedPartner`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 27812
#260128 21:40:26 server id 1  end_log_pos 27891 CRC32 0x4f23f6e5 	Anonymous_GTID	last_committed=32	sequence_number=33	r
br_only=no	original_committed_timestamp=1769604026181600	immediate_commit_timestamp=1769604026181600	transaction_length
=818
# original_commit_timestamp=1769604026181600 (2026-01-28 21:40:26.181600 대한민국 표준시)
# immediate_commit_timestamp=1769604026181600 (2026-01-28 21:40:26.181600 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026181600*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 27891
#260128 21:40:26 server id 1  end_log_pos 28630 CRC32 0xaf1d759c 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
80
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `segment` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL DEFAULT 'NORMAL',
    `totalPurchaseAmount` INTEGER NOT NULL DEFAULT 0,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 28630
#260128 21:40:26 server id 1  end_log_pos 28709 CRC32 0x772e504a 	Anonymous_GTID	last_committed=33	sequence_number=34	r
br_only=no	original_committed_timestamp=1769604026189441	immediate_commit_timestamp=1769604026189441	transaction_length
=947
# original_commit_timestamp=1769604026189441 (2026-01-28 21:40:26.189441 대한민국 표준시)
# immediate_commit_timestamp=1769604026189441 (2026-01-28 21:40:26.189441 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026189441*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 28709
#260128 21:40:26 server id 1  end_log_pos 29577 CRC32 0x9df5d4ed 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
81
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `tags` TEXT NULL,
    `rating` DECIMAL(2, 1) NULL,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `soldCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 29577
#260128 21:40:26 server id 1  end_log_pos 29656 CRC32 0xc185e07a 	Anonymous_GTID	last_committed=34	sequence_number=35	r
br_only=no	original_committed_timestamp=1769604026200806	immediate_commit_timestamp=1769604026200806	transaction_length
=1814
# original_commit_timestamp=1769604026200806 (2026-01-28 21:40:26.200806 대한민국 표준시)
# immediate_commit_timestamp=1769604026200806 (2026-01-28 21:40:26.200806 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026200806*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 29656
#260128 21:40:26 server id 1  end_log_pos 31391 CRC32 0x402097f4 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
82
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `orderSource` VARCHAR(191) NULL,
    `productInfo` TEXT NULL,
    `customerName` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `customerMobile` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `shippingAddr` TEXT NULL,
    `shippingMethod` VARCHAR(191) NULL,
    `shippingFee` DECIMAL(10, 2) NULL,
    `recipientName` VARCHAR(191) NULL,
    `recipientPhone` VARCHAR(191) NULL,
    `shippingStatus` VARCHAR(191) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `basePrice` DECIMAL(10, 2) NULL,
    `additionalFee` DECIMAL(10, 2) NULL,
    `giftOption` VARCHAR(191) NULL,
    `staffName` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `memo` TEXT NULL,
    `partner` VARCHAR(191) NULL,
    `ordererName` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `recipientMobile` VARCHAR(191) NULL,
    `recipientZipCode` VARCHAR(191) NULL,
    `recipientAddr` TEXT NULL,
    `deliveryMsg` TEXT NULL,
    `courier` VARCHAR(191) NULL,
    `giftSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 31391
#260128 21:40:26 server id 1  end_log_pos 31470 CRC32 0xc97670f9 	Anonymous_GTID	last_committed=35	sequence_number=36	r
br_only=no	original_committed_timestamp=1769604026207446	immediate_commit_timestamp=1769604026207446	transaction_length
=533
# original_commit_timestamp=1769604026207446 (2026-01-28 21:40:26.207446 대한민국 표준시)
# immediate_commit_timestamp=1769604026207446 (2026-01-28 21:40:26.207446 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026207446*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 31470
#260128 21:40:26 server id 1  end_log_pos 31924 CRC32 0x3e8917b2 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
83
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 31924
#260128 21:40:26 server id 1  end_log_pos 32003 CRC32 0xb0da392c 	Anonymous_GTID	last_committed=36	sequence_number=37	r
br_only=no	original_committed_timestamp=1769604026213347	immediate_commit_timestamp=1769604026213347	transaction_length
=673
# original_commit_timestamp=1769604026213347 (2026-01-28 21:40:26.213347 대한민국 표준시)
# immediate_commit_timestamp=1769604026213347 (2026-01-28 21:40:26.213347 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026213347*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 32003
#260128 21:40:26 server id 1  end_log_pos 32597 CRC32 0xd6879362 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
84
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `value` DECIMAL(10, 2) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `source` VARCHAR(191) NULL,
    `assignedToId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 32597
#260128 21:40:26 server id 1  end_log_pos 32676 CRC32 0xcf97f8a9 	Anonymous_GTID	last_committed=37	sequence_number=38	r
br_only=no	original_committed_timestamp=1769604026220327	immediate_commit_timestamp=1769604026220327	transaction_length
=898
# original_commit_timestamp=1769604026220327 (2026-01-28 21:40:26.220327 대한민국 표준시)
# immediate_commit_timestamp=1769604026220327 (2026-01-28 21:40:26.220327 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026220327*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 32676
#260128 21:40:26 server id 1  end_log_pos 33495 CRC32 0x75749814 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
85
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Ticket` (
    `id` VARCHAR(191) NOT NULL,
    `ticketNumber` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `category` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `response` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ticket_ticketNumber_key`(`ticketNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 33495
#260128 21:40:26 server id 1  end_log_pos 33574 CRC32 0x82f98f8f 	Anonymous_GTID	last_committed=38	sequence_number=39	r
br_only=no	original_committed_timestamp=1769604026226502	immediate_commit_timestamp=1769604026226502	transaction_length
=894
# original_commit_timestamp=1769604026226502 (2026-01-28 21:40:26.226502 대한민국 표준시)
# immediate_commit_timestamp=1769604026226502 (2026-01-28 21:40:26.226502 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026226502*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 33574
#260128 21:40:26 server id 1  end_log_pos 34389 CRC32 0xeec68df5 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
86
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Campaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `budget` DECIMAL(10, 2) NULL,
    `spent` DECIMAL(10, 2) NULL,
    `roi` DECIMAL(10, 2) NULL,
    `targetCount` INTEGER NOT NULL DEFAULT 0,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `openRate` DECIMAL(5, 2) NULL,
    `clickRate` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 34389
#260128 21:40:26 server id 1  end_log_pos 34468 CRC32 0x5fc77456 	Anonymous_GTID	last_committed=39	sequence_number=40	r
br_only=no	original_committed_timestamp=1769604026234175	immediate_commit_timestamp=1769604026234175	transaction_length
=755
# original_commit_timestamp=1769604026234175 (2026-01-28 21:40:26.234175 대한민국 표준시)
# immediate_commit_timestamp=1769604026234175 (2026-01-28 21:40:26.234175 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026234175*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 34468
#260128 21:40:26 server id 1  end_log_pos 35144 CRC32 0x264ec143 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
87
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Partner` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `type` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `commission` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Partner_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 35144
#260128 21:40:26 server id 1  end_log_pos 35223 CRC32 0xb3874735 	Anonymous_GTID	last_committed=40	sequence_number=41	r
br_only=no	original_committed_timestamp=1769604026241782	immediate_commit_timestamp=1769604026241782	transaction_length
=803
# original_commit_timestamp=1769604026241782 (2026-01-28 21:40:26.241782 대한민국 표준시)
# immediate_commit_timestamp=1769604026241782 (2026-01-28 21:40:26.241782 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026241782*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 35223
#260128 21:40:26 server id 1  end_log_pos 35947 CRC32 0x98d6759a 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
88
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Part` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `partNumber` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `minStock` INTEGER NOT NULL DEFAULT 10,
    `unitPrice` DECIMAL(10, 2) NULL,
    `location` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Part_partNumber_key`(`partNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 35947
#260128 21:40:26 server id 1  end_log_pos 36026 CRC32 0x9a3549ce 	Anonymous_GTID	last_committed=41	sequence_number=42	r
br_only=no	original_committed_timestamp=1769604026250889	immediate_commit_timestamp=1769604026250889	transaction_length
=873
# original_commit_timestamp=1769604026250889 (2026-01-28 21:40:26.250889 대한민국 표준시)
# immediate_commit_timestamp=1769604026250889 (2026-01-28 21:40:26.250889 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026250889*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 36026
#260128 21:40:26 server id 1  end_log_pos 36820 CRC32 0x07127324 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
89
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `InventoryLog` (
    `id` VARCHAR(191) NOT NULL,
    `partId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `beforeQty` INTEGER NOT NULL,
    `afterQty` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `relatedPartId` VARCHAR(191) NULL,
    `relatedPartName` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryLog_partId_idx`(`partId`),
    INDEX `InventoryLog_type_idx`(`type`),
    INDEX `InventoryLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 36820
#260128 21:40:26 server id 1  end_log_pos 36899 CRC32 0x4b6ef789 	Anonymous_GTID	last_committed=42	sequence_number=43	r
br_only=no	original_committed_timestamp=1769604026257670	immediate_commit_timestamp=1769604026257670	transaction_length
=691
# original_commit_timestamp=1769604026257670 (2026-01-28 21:40:26.257670 대한민국 표준시)
# immediate_commit_timestamp=1769604026257670 (2026-01-28 21:40:26.257670 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026257670*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 36899
#260128 21:40:26 server id 1  end_log_pos 37511 CRC32 0x3f54d6f6 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
90
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `KnowledgeArticle` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 37511
#260128 21:40:26 server id 1  end_log_pos 37590 CRC32 0x72f01d58 	Anonymous_GTID	last_committed=43	sequence_number=44	r
br_only=no	original_committed_timestamp=1769604026263665	immediate_commit_timestamp=1769604026263665	transaction_length
=677
# original_commit_timestamp=1769604026263665 (2026-01-28 21:40:26.263665 대한민국 표준시)
# immediate_commit_timestamp=1769604026263665 (2026-01-28 21:40:26.263665 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026263665*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 37590
#260128 21:40:26 server id 1  end_log_pos 38188 CRC32 0xcfdf43af 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
91
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Gift` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `value` DECIMAL(10, 2) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 38188
#260128 21:40:26 server id 1  end_log_pos 38267 CRC32 0xef548306 	Anonymous_GTID	last_committed=44	sequence_number=45	r
br_only=no	original_committed_timestamp=1769604026269466	immediate_commit_timestamp=1769604026269466	transaction_length
=567
# original_commit_timestamp=1769604026269466 (2026-01-28 21:40:26.269466 대한민국 표준시)
# immediate_commit_timestamp=1769604026269466 (2026-01-28 21:40:26.269466 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026269466*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 38267
#260128 21:40:26 server id 1  end_log_pos 38755 CRC32 0xbfa501fd 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
92
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `CustomerNote` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorName` VARCHAR(191) NULL,
    `noteType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 38755
#260128 21:40:26 server id 1  end_log_pos 38834 CRC32 0x12bf7c1e 	Anonymous_GTID	last_committed=45	sequence_number=46	r
br_only=no	original_committed_timestamp=1769604026279666	immediate_commit_timestamp=1769604026279666	transaction_length
=1173
# original_commit_timestamp=1769604026279666 (2026-01-28 21:40:26.279666 대한민국 표준시)
# immediate_commit_timestamp=1769604026279666 (2026-01-28 21:40:26.279666 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026279666*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 38834
#260128 21:40:26 server id 1  end_log_pos 39928 CRC32 0xf4380ae2 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
93
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `ChatSession` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'WAITING',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'WEB',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `assignedAt` DATETIME(3) NULL,
    `escalatedAt` DATETIME(3) NULL,
    `escalateReason` TEXT NULL,
    `isEscalated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatSession_phone_idx`(`phone`),
    INDEX `ChatSession_status_idx`(`status`),
    INDEX `ChatSession_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 39928
#260128 21:40:26 server id 1  end_log_pos 40007 CRC32 0x22dc0b83 	Anonymous_GTID	last_committed=46	sequence_number=47	r
br_only=no	original_committed_timestamp=1769604026285824	immediate_commit_timestamp=1769604026285824	transaction_length
=531
# original_commit_timestamp=1769604026285824 (2026-01-28 21:40:26.285824 대한민국 표준시)
# immediate_commit_timestamp=1769604026285824 (2026-01-28 21:40:26.285824 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026285824*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 40007
#260128 21:40:26 server id 1  end_log_pos 40459 CRC32 0x3f31e3b4 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
94
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `senderType` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 40459
#260128 21:40:26 server id 1  end_log_pos 40538 CRC32 0x733480fd 	Anonymous_GTID	last_committed=47	sequence_number=48	r
br_only=no	original_committed_timestamp=1769604026293490	immediate_commit_timestamp=1769604026293490	transaction_length
=1693
# original_commit_timestamp=1769604026293490 (2026-01-28 21:40:26.293490 대한민국 표준시)
# immediate_commit_timestamp=1769604026293490 (2026-01-28 21:40:26.293490 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026293490*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 40538
#260128 21:40:26 server id 1  end_log_pos 42152 CRC32 0x84f0a3cc 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
95
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `AfterService` (
    `id` VARCHAR(191) NOT NULL,
    `asNumber` VARCHAR(191) NULL,
    `ticketNumber` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `customerAddress` TEXT NULL,
    `companyName` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `issueType` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RECEIVED',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `description` TEXT NULL,
    `productName` VARCHAR(191) NULL,
    `serialNumber` VARCHAR(191) NULL,
    `symptom` TEXT NULL,
    `diagnosis` TEXT NULL,
    `resolution` TEXT NULL,
    `repairContent` TEXT NULL,
    `pickupRequestDate` DATETIME(3) NULL,
    `processDate` DATETIME(3) NULL,
    `shipDate` DATETIME(3) NULL,
    `pickupCompleteDate` DATETIME(3) NULL,
    `purchaseDate` DATETIME(3) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `courier` VARCHAR(191) NULL,
    `assignedToId` VARCHAR(191) NULL,
    `serviceDate` DATETIME(3) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `estimatedCost` DECIMAL(10, 2) NULL,
    `actualCost` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AfterService_asNumber_key`(`asNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 42152
#260128 21:40:26 server id 1  end_log_pos 42231 CRC32 0xa3c7454a 	Anonymous_GTID	last_committed=48	sequence_number=49	r
br_only=no	original_committed_timestamp=1769604026304857	immediate_commit_timestamp=1769604026304857	transaction_length
=650
# original_commit_timestamp=1769604026304857 (2026-01-28 21:40:26.304857 대한민국 표준시)
# immediate_commit_timestamp=1769604026304857 (2026-01-28 21:40:26.304857 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026304857*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 42231
#260128 21:40:26 server id 1  end_log_pos 42802 CRC32 0x39337102 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
96
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `FAQ` (
    `id` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 42802
#260128 21:40:26 server id 1  end_log_pos 42881 CRC32 0x414a2034 	Anonymous_GTID	last_committed=49	sequence_number=50	r
br_only=no	original_committed_timestamp=1769604026311051	immediate_commit_timestamp=1769604026311051	transaction_length
=1083
# original_commit_timestamp=1769604026311051 (2026-01-28 21:40:26.311051 대한민국 표준시)
# immediate_commit_timestamp=1769604026311051 (2026-01-28 21:40:26.311051 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026311051*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 42881
#260128 21:40:26 server id 1  end_log_pos 43885 CRC32 0x12101ada 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
97
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(191) NULL,
    `authorName` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `sentiment` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `naverReviewId` VARCHAR(191) NULL,
    `option` VARCHAR(191) NULL,
    `images` TEXT NULL,
    `productUrl` TEXT NULL,
    `topics` TEXT NULL,
    `isAlerted` BOOLEAN NOT NULL DEFAULT false,
    `alertStatus` VARCHAR(191) NULL,
    `alertNote` TEXT NULL,
    `resolvedType` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 43885
#260128 21:40:26 server id 1  end_log_pos 43964 CRC32 0xbcec65dc 	Anonymous_GTID	last_committed=50	sequence_number=51	r
br_only=no	original_committed_timestamp=1769604026317877	immediate_commit_timestamp=1769604026317877	transaction_length
=627
# original_commit_timestamp=1769604026317877 (2026-01-28 21:40:26.317877 대한민국 표준시)
# immediate_commit_timestamp=1769604026317877 (2026-01-28 21:40:26.317877 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026317877*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 43964
#260128 21:40:26 server id 1  end_log_pos 44512 CRC32 0xc0d05354 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
98
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `MallUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MallUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 44512
#260128 21:40:26 server id 1  end_log_pos 44591 CRC32 0xbc910013 	Anonymous_GTID	last_committed=51	sequence_number=52	r
br_only=no	original_committed_timestamp=1769604026325731	immediate_commit_timestamp=1769604026325731	transaction_length
=1370
# original_commit_timestamp=1769604026325731 (2026-01-28 21:40:26.325731 대한민국 표준시)
# immediate_commit_timestamp=1769604026325731 (2026-01-28 21:40:26.325731 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026325731*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 44591
#260128 21:40:26 server id 1  end_log_pos 45882 CRC32 0x0497180a 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 78
99
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `MallOrder` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NULL,
    `shippingFee` DECIMAL(10, 2) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `recipientName` VARCHAR(191) NULL,
    `recipientAddr` TEXT NULL,
    `recipientZip` VARCHAR(191) NULL,
    `shippingName` VARCHAR(191) NULL,
    `shippingPhone` VARCHAR(191) NULL,
    `shippingAddress` TEXT NULL,
    `shippingMemo` VARCHAR(191) NULL,
    `deliveryMsg` TEXT NULL,
    `courier` VARCHAR(191) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `trackingCompany` VARCHAR(191) NULL,
    `items` JSON NULL,
    `paidAt` DATETIME(3) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MallOrder_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 45882
#260128 21:40:26 server id 1  end_log_pos 45961 CRC32 0xbde5410e 	Anonymous_GTID	last_committed=52	sequence_number=53	r
br_only=no	original_committed_timestamp=1769604026335017	immediate_commit_timestamp=1769604026335017	transaction_length
=1016
# original_commit_timestamp=1769604026335017 (2026-01-28 21:40:26.335017 대한민국 표준시)
# immediate_commit_timestamp=1769604026335017 (2026-01-28 21:40:26.335017 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026335017*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 45961
#260128 21:40:26 server id 1  end_log_pos 46898 CRC32 0x7c1ec56e 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
00
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `MallProduct` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `originalPrice` DECIMAL(10, 2) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(191) NULL,
    `images` JSON NULL,
    `tags` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `rating` DECIMAL(3, 2) NULL,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MallProduct_isActive_idx`(`isActive`),
    INDEX `MallProduct_isFeatured_idx`(`isFeatured`),
    INDEX `MallProduct_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 46898
#260128 21:40:26 server id 1  end_log_pos 46977 CRC32 0xa3ad5c9b 	Anonymous_GTID	last_committed=53	sequence_number=54	r
br_only=no	original_committed_timestamp=1769604026343581	immediate_commit_timestamp=1769604026343581	transaction_length
=1072
# original_commit_timestamp=1769604026343581 (2026-01-28 21:40:26.343581 대한민국 표준시)
# immediate_commit_timestamp=1769604026343581 (2026-01-28 21:40:26.343581 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026343581*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 46977
#260128 21:40:26 server id 1  end_log_pos 47970 CRC32 0x0b8db93a 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
01
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `discountType` VARCHAR(191) NOT NULL,
    `discountValue` DECIMAL(10, 2) NOT NULL,
    `minOrderAmount` DECIMAL(10, 2) NULL,
    `maxDiscountAmount` DECIMAL(10, 2) NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `usageLimit` INTEGER NOT NULL DEFAULT 0,
    `usagePerCustomer` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `targetSegment` VARCHAR(191) NULL,
    `targetCustomers` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 47970
#260128 21:40:26 server id 1  end_log_pos 48049 CRC32 0x4017f579 	Anonymous_GTID	last_committed=54	sequence_number=55	r
br_only=no	original_committed_timestamp=1769604026351383	immediate_commit_timestamp=1769604026351383	transaction_length
=643
# original_commit_timestamp=1769604026351383 (2026-01-28 21:40:26.351383 대한민국 표준시)
# immediate_commit_timestamp=1769604026351383 (2026-01-28 21:40:26.351383 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026351383*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 48049
#260128 21:40:26 server id 1  end_log_pos 48613 CRC32 0xd3ed94b9 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
02
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `CouponUsage` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL,
    `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CouponUsage_couponId_idx`(`couponId`),
    INDEX `CouponUsage_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 48613
#260128 21:40:26 server id 1  end_log_pos 48692 CRC32 0x18d6d745 	Anonymous_GTID	last_committed=55	sequence_number=56	r
br_only=no	original_committed_timestamp=1769604026359496	immediate_commit_timestamp=1769604026359496	transaction_length
=2931
# original_commit_timestamp=1769604026359496 (2026-01-28 21:40:26.359496 대한민국 표준시)
# immediate_commit_timestamp=1769604026359496 (2026-01-28 21:40:26.359496 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026359496*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 48692
#260128 21:40:26 server id 1  end_log_pos 51544 CRC32 0xb4e75221 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
03
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `ChatbotConfig` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '湲곕낯 梨쀫큸',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `welcomeMessage` TEXT NULL,
    `systemPrompt` TEXT NULL,
    `brandVoice` VARCHAR(191) NULL,
    `responseStyle` VARCHAR(191) NULL DEFAULT 'BALANCED',
    `maxTokens` INTEGER NOT NULL DEFAULT 1000,
    `temperature` DOUBLE NOT NULL DEFAULT 0.7,
    `requirePhoneAuth` BOOLEAN NOT NULL DEFAULT true,
    `autoGreeting` BOOLEAN NOT NULL DEFAULT true,
    `showSuggestions` BOOLEAN NOT NULL DEFAULT true,
    `maxConversationLength` INTEGER NOT NULL DEFAULT 50,
    `enableEscalation` BOOLEAN NOT NULL DEFAULT true,
    `escalationKeywords` TEXT NULL,
    `autoEscalateOnFail` BOOLEAN NOT NULL DEFAULT true,
    `maxFailBeforeEscalate` INTEGER NOT NULL DEFAULT 3,
    `businessHoursOnly` BOOLEAN NOT NULL DEFAULT false,
    `businessHoursStart` VARCHAR(191) NULL,
    `businessHoursEnd` VARCHAR(191) NULL,
    `businessDays` VARCHAR(191) NULL,
    `outOfHoursMessage` TEXT NULL,
    `defaultLanguage` VARCHAR(191) NULL DEFAULT 'ko',
    `supportedLanguages` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL DEFAULT 'Asia/Seoul',
    `themeColor` VARCHAR(191) NULL DEFAULT '#3B82F6',
    `chatPosition` VARCHAR(191) NULL DEFAULT 'bottom-right',
    `avatarUrl` VARCHAR(191) NULL,
    `dataRetentionDays` INTEGER NOT NULL DEFAULT 90,
    `anonymizeAfterDays` INTEGER NOT NULL DEFAULT 30,
    `enableEncryption` BOOLEAN NOT NULL DEFAULT true,
    `gdprCompliant` BOOLEAN NOT NULL DEFAULT true,
    `webhookUrl` VARCHAR(191) NULL,
    `slackChannel` VARCHAR(191) NULL,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT false,
    `notificationEmail` VARCHAR(191) NULL,
    `enableSentimentAnalysis` BOOLEAN NOT NULL DEFAULT true,
    `enableIntentRecognition` BOOLEAN NOT NULL DEFAULT true,
    `enableContextMemory` BOOLEAN NOT NULL DEFAULT true,
    `contextMemoryLength` INTEGER NOT NULL DEFAULT 10,
    `blockedKeywords` TEXT NULL,
    `sensitiveDataFilter` BOOLEAN NOT NULL DEFAULT true,
    `enableABTesting` BOOLEAN NOT NULL DEFAULT false,
    `abTestVariant` VARCHAR(191) NULL DEFAULT 'A',
    `apiRateLimit` INTEGER NOT NULL DEFAULT 100,
    `enableApiAccess` BOOLEAN NOT NULL DEFAULT false,
    `enableAnalytics` BOOLEAN NOT NULL DEFAULT true,
    `trackUserBehavior` BOOLEAN NOT NULL DEFAULT true,
    `enableAutoLearning` BOOLEAN NOT NULL DEFAULT false,
    `learningThreshold` DOUBLE NOT NULL DEFAULT 0.8,
    `version` INTEGER NOT NULL DEFAULT 1,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 51544
#260128 21:40:26 server id 1  end_log_pos 51623 CRC32 0x7f3bba94 	Anonymous_GTID	last_committed=56	sequence_number=57	r
br_only=no	original_committed_timestamp=1769604026368480	immediate_commit_timestamp=1769604026368480	transaction_length
=789
# original_commit_timestamp=1769604026368480 (2026-01-28 21:40:26.368480 대한민국 표준시)
# immediate_commit_timestamp=1769604026368480 (2026-01-28 21:40:26.368480 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026368480*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 51623
#260128 21:40:26 server id 1  end_log_pos 52333 CRC32 0xdc6aeb05 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
04
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `MallQnA` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `answer` TEXT NULL,
    `answeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MallQnA_userId_idx`(`userId`),
    INDEX `MallQnA_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 52333
#260128 21:40:26 server id 1  end_log_pos 52412 CRC32 0xf18b5c32 	Anonymous_GTID	last_committed=57	sequence_number=58	r
br_only=no	original_committed_timestamp=1769604026377296	immediate_commit_timestamp=1769604026377296	transaction_length
=816
# original_commit_timestamp=1769604026377296 (2026-01-28 21:40:26.377296 대한민국 표준시)
# immediate_commit_timestamp=1769604026377296 (2026-01-28 21:40:26.377296 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026377296*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 52412
#260128 21:40:26 server id 1  end_log_pos 53149 CRC32 0x97739722 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
05
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `BaseProduct` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `partnerCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BaseProduct_isActive_idx`(`isActive`),
    INDEX `BaseProduct_sortOrder_idx`(`sortOrder`),
    INDEX `BaseProduct_partnerCode_idx`(`partnerCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 53149
#260128 21:40:26 server id 1  end_log_pos 53228 CRC32 0xdb6da507 	Anonymous_GTID	last_committed=58	sequence_number=59	r
br_only=no	original_committed_timestamp=1769604026386547	immediate_commit_timestamp=1769604026386547	transaction_length
=737
# original_commit_timestamp=1769604026386547 (2026-01-28 21:40:26.386547 대한민국 표준시)
# immediate_commit_timestamp=1769604026386547 (2026-01-28 21:40:26.386547 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026386547*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 53228
#260128 21:40:26 server id 1  end_log_pos 53886 CRC32 0x86750f11 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
06
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    INDEX `Role_name_idx`(`name`),
    INDEX `Role_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 53886
#260128 21:40:26 server id 1  end_log_pos 53965 CRC32 0x0eb78177 	Anonymous_GTID	last_committed=59	sequence_number=60	r
br_only=no	original_committed_timestamp=1769604026395084	immediate_commit_timestamp=1769604026395084	transaction_length
=886
# original_commit_timestamp=1769604026395084 (2026-01-28 21:40:26.395084 대한민국 표준시)
# immediate_commit_timestamp=1769604026395084 (2026-01-28 21:40:26.395084 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026395084*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 53965
#260128 21:40:26 server id 1  end_log_pos 54772 CRC32 0xd9b8385d 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
07
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'own',
    `displayName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Permission_resource_idx`(`resource`),
    INDEX `Permission_category_idx`(`category`),
    UNIQUE INDEX `Permission_resource_action_scope_key`(`resource`, `action`, `scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 54772
#260128 21:40:26 server id 1  end_log_pos 54851 CRC32 0x9f38adec 	Anonymous_GTID	last_committed=60	sequence_number=61	r
br_only=no	original_committed_timestamp=1769604026404498	immediate_commit_timestamp=1769604026404498	transaction_length
=665
# original_commit_timestamp=1769604026404498 (2026-01-28 21:40:26.404498 대한민국 표준시)
# immediate_commit_timestamp=1769604026404498 (2026-01-28 21:40:26.404498 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026404498*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 54851
#260128 21:40:26 server id 1  end_log_pos 55437 CRC32 0xfb42c4fc 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
08
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermission_roleId_idx`(`roleId`),
    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 55437
#260128 21:40:26 server id 1  end_log_pos 55516 CRC32 0x01e14ae9 	Anonymous_GTID	last_committed=61	sequence_number=62	r
br_only=no	original_committed_timestamp=1769604026413398	immediate_commit_timestamp=1769604026413398	transaction_length
=682
# original_commit_timestamp=1769604026413398 (2026-01-28 21:40:26.413398 대한민국 표준시)
# immediate_commit_timestamp=1769604026413398 (2026-01-28 21:40:26.413398 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026413398*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 55516
#260128 21:40:26 server id 1  end_log_pos 56119 CRC32 0xae85fd1a 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
09
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `UserRole` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `UserRole_userId_idx`(`userId`),
    INDEX `UserRole_roleId_idx`(`roleId`),
    UNIQUE INDEX `UserRole_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 56119
#260128 21:40:26 server id 1  end_log_pos 56198 CRC32 0xf8a350e7 	Anonymous_GTID	last_committed=62	sequence_number=63	r
br_only=no	original_committed_timestamp=1769604026427733	immediate_commit_timestamp=1769604026427733	transaction_length
=906
# original_commit_timestamp=1769604026427733 (2026-01-28 21:40:26.427733 대한민국 표준시)
# immediate_commit_timestamp=1769604026427733 (2026-01-28 21:40:26.427733 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026427733*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 56198
#260128 21:40:26 server id 1  end_log_pos 57025 CRC32 0x8db80b0e 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
10
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `status` VARCHAR(191) NOT NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_resource_idx`(`resource`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 57025
#260128 21:40:26 server id 1  end_log_pos 57104 CRC32 0x83901b78 	Anonymous_GTID	last_committed=63	sequence_number=64	r
br_only=no	original_committed_timestamp=1769604026438683	immediate_commit_timestamp=1769604026438683	transaction_length
=837
# original_commit_timestamp=1769604026438683 (2026-01-28 21:40:26.438683 대한민국 표준시)
# immediate_commit_timestamp=1769604026438683 (2026-01-28 21:40:26.438683 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026438683*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 57104
#260128 21:40:26 server id 1  end_log_pos 57862 CRC32 0x7f56fad5 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
11
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `UserSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSession_token_key`(`token`),
    INDEX `UserSession_userId_idx`(`userId`),
    INDEX `UserSession_token_idx`(`token`),
    INDEX `UserSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 57862
#260128 21:40:26 server id 1  end_log_pos 57941 CRC32 0x86f528c4 	Anonymous_GTID	last_committed=64	sequence_number=65	r
br_only=no	original_committed_timestamp=1769604026450060	immediate_commit_timestamp=1769604026450060	transaction_length
=916
# original_commit_timestamp=1769604026450060 (2026-01-28 21:40:26.450060 대한민국 표준시)
# immediate_commit_timestamp=1769604026450060 (2026-01-28 21:40:26.450060 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026450060*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 57941
#260128 21:40:26 server id 1  end_log_pos 58778 CRC32 0xb6e3a1e7 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
12
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `TrashBin` (
    `id` VARCHAR(191) NOT NULL,
    `originalId` VARCHAR(191) NOT NULL,
    `originalTable` VARCHAR(191) NOT NULL,
    `originalData` JSON NOT NULL,
    `deletedBy` VARCHAR(191) NULL,
    `deletedByName` VARCHAR(191) NULL,
    `deleteReason` TEXT NULL,
    `displayTitle` VARCHAR(191) NULL,
    `displayInfo` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrashBin_originalTable_idx`(`originalTable`),
    INDEX `TrashBin_expiresAt_idx`(`expiresAt`),
    INDEX `TrashBin_createdAt_idx`(`createdAt`),
    INDEX `TrashBin_deletedBy_idx`(`deletedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 58778
#260128 21:40:26 server id 1  end_log_pos 58857 CRC32 0x17775b59 	Anonymous_GTID	last_committed=65	sequence_number=66	r
br_only=no	original_committed_timestamp=1769604026462625	immediate_commit_timestamp=1769604026462625	transaction_length
=1333
# original_commit_timestamp=1769604026462625 (2026-01-28 21:40:26.462625 대한민국 표준시)
# immediate_commit_timestamp=1769604026462625 (2026-01-28 21:40:26.462625 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026462625*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 58857
#260128 21:40:26 server id 1  end_log_pos 60111 CRC32 0x31d9e8f7 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
13
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `EducationMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NULL,
    `fileName` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `thumbnailUrl` TEXT NULL,
    `duration` INTEGER NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `downloads` INTEGER NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `targetPartner` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdByName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EducationMaterial_category_idx`(`category`),
    INDEX `EducationMaterial_type_idx`(`type`),
    INDEX `EducationMaterial_isPublished_idx`(`isPublished`),
    INDEX `EducationMaterial_targetPartner_idx`(`targetPartner`),
    INDEX `EducationMaterial_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 60111
#260128 21:40:26 server id 1  end_log_pos 60190 CRC32 0x3df33e09 	Anonymous_GTID	last_committed=66	sequence_number=67	r
br_only=no	original_committed_timestamp=1769604026476979	immediate_commit_timestamp=1769604026476979	transaction_length
=1051
# original_commit_timestamp=1769604026476979 (2026-01-28 21:40:26.476979 대한민국 표준시)
# immediate_commit_timestamp=1769604026476979 (2026-01-28 21:40:26.476979 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026476979*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 60190
#260128 21:40:26 server id 1  end_log_pos 61162 CRC32 0x490aca21 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
14
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `relatedId` VARCHAR(191) NULL,
    `relatedType` VARCHAR(191) NULL,
    `senderPartner` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NULL,
    `targetPartner` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_targetPartner_idx`(`targetPartner`),
    INDEX `Notification_targetUserId_idx`(`targetUserId`),
    INDEX `Notification_type_idx`(`type`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
/*!*/;
# at 61162
#260128 21:40:26 server id 1  end_log_pos 61241 CRC32 0x299fd895 	Anonymous_GTID	last_committed=67	sequence_number=68	r
br_only=no	original_committed_timestamp=1769604026498721	immediate_commit_timestamp=1769604026498721	transaction_length
=329
# original_commit_timestamp=1769604026498721 (2026-01-28 21:40:26.498721 대한민국 표준시)
# immediate_commit_timestamp=1769604026498721 (2026-01-28 21:40:26.498721 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026498721*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 61241
#260128 21:40:26 server id 1  end_log_pos 61491 CRC32 0x69c1d04b 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
15
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DE
LETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 61491
#260128 21:40:26 server id 1  end_log_pos 61570 CRC32 0xc1b50316 	Anonymous_GTID	last_committed=68	sequence_number=69	r
br_only=no	original_committed_timestamp=1769604026520771	immediate_commit_timestamp=1769604026520771	transaction_length
=327
# original_commit_timestamp=1769604026520771 (2026-01-28 21:40:26.520771 대한민국 표준시)
# immediate_commit_timestamp=1769604026520771 (2026-01-28 21:40:26.520771 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026520771*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 61570
#260128 21:40:26 server id 1  end_log_pos 61818 CRC32 0x1187bf26 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
16
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DEL
ETE CASCADE ON UPDATE CASCADE
/*!*/;
# at 61818
#260128 21:40:26 server id 1  end_log_pos 61897 CRC32 0x4ab148df 	Anonymous_GTID	last_committed=69	sequence_number=70	r
br_only=no	original_committed_timestamp=1769604026542483	immediate_commit_timestamp=1769604026542483	transaction_length
=334
# original_commit_timestamp=1769604026542483 (2026-01-28 21:40:26.542483 대한민국 표준시)
# immediate_commit_timestamp=1769604026542483 (2026-01-28 21:40:26.542483 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026542483*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 61897
#260128 21:40:26 server id 1  end_log_pos 62152 CRC32 0xb000f67f 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
17
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) 
ON DELETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 62152
#260128 21:40:26 server id 1  end_log_pos 62231 CRC32 0x6d2314ba 	Anonymous_GTID	last_committed=70	sequence_number=71	r
br_only=no	original_committed_timestamp=1769604026564039	immediate_commit_timestamp=1769604026564039	transaction_length
=327
# original_commit_timestamp=1769604026564039 (2026-01-28 21:40:26.564039 대한민국 표준시)
# immediate_commit_timestamp=1769604026564039 (2026-01-28 21:40:26.564039 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026564039*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 62231
#260128 21:40:26 server id 1  end_log_pos 62479 CRC32 0x5958587c 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
18
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELE
TE SET NULL ON UPDATE CASCADE
/*!*/;
# at 62479
#260128 21:40:26 server id 1  end_log_pos 62558 CRC32 0x368b6db7 	Anonymous_GTID	last_committed=71	sequence_number=72	r
br_only=no	original_committed_timestamp=1769604026590063	immediate_commit_timestamp=1769604026590063	transaction_length
=327
# original_commit_timestamp=1769604026590063 (2026-01-28 21:40:26.590063 대한민국 표준시)
# immediate_commit_timestamp=1769604026590063 (2026-01-28 21:40:26.590063 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026590063*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 62558
#260128 21:40:26 server id 1  end_log_pos 62806 CRC32 0x0bcad71c 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
19
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELE
TE SET NULL ON UPDATE CASCADE
/*!*/;
# at 62806
#260128 21:40:26 server id 1  end_log_pos 62885 CRC32 0x144bba13 	Anonymous_GTID	last_committed=72	sequence_number=73	r
br_only=no	original_committed_timestamp=1769604026615317	immediate_commit_timestamp=1769604026615317	transaction_length
=331
# original_commit_timestamp=1769604026615317 (2026-01-28 21:40:26.615317 대한민국 표준시)
# immediate_commit_timestamp=1769604026615317 (2026-01-28 21:40:26.615317 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026615317*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 62885
#260128 21:40:26 server id 1  end_log_pos 63137 CRC32 0xe1382d0f 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
20
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON 
DELETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 63137
#260128 21:40:26 server id 1  end_log_pos 63216 CRC32 0xcfec4b38 	Anonymous_GTID	last_committed=73	sequence_number=74	r
br_only=no	original_committed_timestamp=1769604026640715	immediate_commit_timestamp=1769604026640715	transaction_length
=331
# original_commit_timestamp=1769604026640715 (2026-01-28 21:40:26.640715 대한민국 표준시)
# immediate_commit_timestamp=1769604026640715 (2026-01-28 21:40:26.640715 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026640715*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 63216
#260128 21:40:26 server id 1  end_log_pos 63468 CRC32 0xfaf6fce8 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
21
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON 
DELETE SET NULL ON UPDATE CASCADE
/*!*/;
# at 63468
#260128 21:40:26 server id 1  end_log_pos 63547 CRC32 0x8c03152b 	Anonymous_GTID	last_committed=74	sequence_number=75	r
br_only=no	original_committed_timestamp=1769604026663071	immediate_commit_timestamp=1769604026663071	transaction_length
=330
# original_commit_timestamp=1769604026663071 (2026-01-28 21:40:26.663071 대한민국 표준시)
# immediate_commit_timestamp=1769604026663071 (2026-01-28 21:40:26.663071 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026663071*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 63547
#260128 21:40:26 server id 1  end_log_pos 63798 CRC32 0xdbfd394c 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
22
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON 
DELETE CASCADE ON UPDATE CASCADE
/*!*/;
# at 63798
#260128 21:40:26 server id 1  end_log_pos 63877 CRC32 0x91109cda 	Anonymous_GTID	last_committed=75	sequence_number=76	r
br_only=no	original_committed_timestamp=1769604026683763	immediate_commit_timestamp=1769604026683763	transaction_length
=327
# original_commit_timestamp=1769604026683763 (2026-01-28 21:40:26.683763 대한민국 표준시)
# immediate_commit_timestamp=1769604026683763 (2026-01-28 21:40:26.683763 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026683763*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 63877
#260128 21:40:26 server id 1  end_log_pos 64125 CRC32 0xb1307720 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
23
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `Gift` ADD CONSTRAINT `Gift_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELE
TE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 64125
#260128 21:40:26 server id 1  end_log_pos 64204 CRC32 0x3667466d 	Anonymous_GTID	last_committed=76	sequence_number=77	r
br_only=no	original_committed_timestamp=1769604026707288	immediate_commit_timestamp=1769604026707288	transaction_length
=343
# original_commit_timestamp=1769604026707288 (2026-01-28 21:40:26.707288 대한민국 표준시)
# immediate_commit_timestamp=1769604026707288 (2026-01-28 21:40:26.707288 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026707288*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 64204
#260128 21:40:26 server id 1  end_log_pos 64468 CRC32 0x53d1b55d 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
24
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `CustomerNote` ADD CONSTRAINT `CustomerNote_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Custome
r`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 64468
#260128 21:40:26 server id 1  end_log_pos 64547 CRC32 0x647d00f1 	Anonymous_GTID	last_committed=77	sequence_number=78	r
br_only=no	original_committed_timestamp=1769604026730735	immediate_commit_timestamp=1769604026730735	transaction_length
=341
# original_commit_timestamp=1769604026730735 (2026-01-28 21:40:26.730735 대한민국 표준시)
# immediate_commit_timestamp=1769604026730735 (2026-01-28 21:40:26.730735 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026730735*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 64547
#260128 21:40:26 server id 1  end_log_pos 64809 CRC32 0x7e8cc033 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
25
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `ChatSession` ADD CONSTRAINT `ChatSession_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`
(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 64809
#260128 21:40:26 server id 1  end_log_pos 64888 CRC32 0xa5c053c4 	Anonymous_GTID	last_committed=78	sequence_number=79	r
br_only=no	original_committed_timestamp=1769604026754078	immediate_commit_timestamp=1769604026754078	transaction_length
=341
# original_commit_timestamp=1769604026754078 (2026-01-28 21:40:26.754078 대한민국 표준시)
# immediate_commit_timestamp=1769604026754078 (2026-01-28 21:40:26.754078 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026754078*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 64888
#260128 21:40:26 server id 1  end_log_pos 65150 CRC32 0xe7bdaac9 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
26
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `ChatSession` ADD CONSTRAINT `ChatSession_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`
(`id`) ON DELETE SET NULL ON UPDATE CASCADE
/*!*/;
# at 65150
#260128 21:40:26 server id 1  end_log_pos 65229 CRC32 0x2f73f94d 	Anonymous_GTID	last_committed=79	sequence_number=80	r
br_only=no	original_committed_timestamp=1769604026771825	immediate_commit_timestamp=1769604026771825	transaction_length
=341
# original_commit_timestamp=1769604026771825 (2026-01-28 21:40:26.771825 대한민국 표준시)
# immediate_commit_timestamp=1769604026771825 (2026-01-28 21:40:26.771825 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026771825*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 65229
#260128 21:40:26 server id 1  end_log_pos 65491 CRC32 0x8094567b 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
27
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ChatSession
`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
/*!*/;
# at 65491
#260128 21:40:26 server id 1  end_log_pos 65570 CRC32 0xeeb5d39f 	Anonymous_GTID	last_committed=80	sequence_number=81	r
br_only=no	original_committed_timestamp=1769604026792908	immediate_commit_timestamp=1769604026792908	transaction_length
=343
# original_commit_timestamp=1769604026792908 (2026-01-28 21:40:26.792908 대한민국 표준시)
# immediate_commit_timestamp=1769604026792908 (2026-01-28 21:40:26.792908 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026792908*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 65570
#260128 21:40:26 server id 1  end_log_pos 65834 CRC32 0xb90a5953 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
28
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `AfterService` ADD CONSTRAINT `AfterService_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Custome
r`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 65834
#260128 21:40:26 server id 1  end_log_pos 65913 CRC32 0x5ee45cd7 	Anonymous_GTID	last_committed=81	sequence_number=82	r
br_only=no	original_committed_timestamp=1769604026817277	immediate_commit_timestamp=1769604026817277	transaction_length
=334
# original_commit_timestamp=1769604026817277 (2026-01-28 21:40:26.817277 대한민국 표준시)
# immediate_commit_timestamp=1769604026817277 (2026-01-28 21:40:26.817277 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026817277*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 65913
#260128 21:40:26 server id 1  end_log_pos 66168 CRC32 0xcca021b9 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
29
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `AfterService` ADD CONSTRAINT `AfterService_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE
/*!*/;
# at 66168
#260128 21:40:26 server id 1  end_log_pos 66247 CRC32 0x618702ca 	Anonymous_GTID	last_committed=82	sequence_number=83	r
br_only=no	original_committed_timestamp=1769604026841243	immediate_commit_timestamp=1769604026841243	transaction_length
=343
# original_commit_timestamp=1769604026841243 (2026-01-28 21:40:26.841243 대한민국 표준시)
# immediate_commit_timestamp=1769604026841243 (2026-01-28 21:40:26.841243 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026841243*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 66247
#260128 21:40:26 server id 1  end_log_pos 66511 CRC32 0xcb429edb 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
30
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `AfterService` ADD CONSTRAINT `AfterService_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `Use
r`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
/*!*/;
# at 66511
#260128 21:40:26 server id 1  end_log_pos 66590 CRC32 0x3d734b90 	Anonymous_GTID	last_committed=83	sequence_number=84	r
br_only=no	original_committed_timestamp=1769604026862585	immediate_commit_timestamp=1769604026862585	transaction_length
=329
# original_commit_timestamp=1769604026862585 (2026-01-28 21:40:26.862585 대한민국 표준시)
# immediate_commit_timestamp=1769604026862585 (2026-01-28 21:40:26.862585 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026862585*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 66590
#260128 21:40:26 server id 1  end_log_pos 66840 CRC32 0x79eddfba 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
31
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `MallOrder` ADD CONSTRAINT `MallOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `MallUser`(`id`) ON DE
LETE SET NULL ON UPDATE CASCADE
/*!*/;
# at 66840
#260128 21:40:26 server id 1  end_log_pos 66919 CRC32 0xc86aa950 	Anonymous_GTID	last_committed=84	sequence_number=85	r
br_only=no	original_committed_timestamp=1769604026880899	immediate_commit_timestamp=1769604026880899	transaction_length
=335
# original_commit_timestamp=1769604026880899 (2026-01-28 21:40:26.880899 대한민국 표준시)
# immediate_commit_timestamp=1769604026880899 (2026-01-28 21:40:26.880899 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026880899*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 66919
#260128 21:40:26 server id 1  end_log_pos 67175 CRC32 0xacd18458 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
32
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `CouponUsage` ADD CONSTRAINT `CouponUsage_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`)
 ON DELETE RESTRICT ON UPDATE CASCADE
/*!*/;
# at 67175
#260128 21:40:26 server id 1  end_log_pos 67254 CRC32 0x11c560b0 	Anonymous_GTID	last_committed=85	sequence_number=86	r
br_only=no	original_committed_timestamp=1769604026899463	immediate_commit_timestamp=1769604026899463	transaction_length
=325
# original_commit_timestamp=1769604026899463 (2026-01-28 21:40:26.899463 대한민국 표준시)
# immediate_commit_timestamp=1769604026899463 (2026-01-28 21:40:26.899463 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026899463*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 67254
#260128 21:40:26 server id 1  end_log_pos 67500 CRC32 0xadb162cc 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
33
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `MallQnA` ADD CONSTRAINT `MallQnA_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `MallUser`(`id`) ON DELETE
 RESTRICT ON UPDATE CASCADE
/*!*/;
# at 67500
#260128 21:40:26 server id 1  end_log_pos 67579 CRC32 0x11222dde 	Anonymous_GTID	last_committed=86	sequence_number=87	r
br_only=no	original_committed_timestamp=1769604026919113	immediate_commit_timestamp=1769604026919113	transaction_length
=334
# original_commit_timestamp=1769604026919113 (2026-01-28 21:40:26.919113 대한민국 표준시)
# immediate_commit_timestamp=1769604026919113 (2026-01-28 21:40:26.919113 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026919113*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 67579
#260128 21:40:26 server id 1  end_log_pos 67834 CRC32 0x8b122ecb 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
34
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`)
 ON DELETE CASCADE ON UPDATE CASCADE
/*!*/;
# at 67834
#260128 21:40:26 server id 1  end_log_pos 67913 CRC32 0xe7423be6 	Anonymous_GTID	last_committed=87	sequence_number=88	r
br_only=no	original_committed_timestamp=1769604026938975	immediate_commit_timestamp=1769604026938975	transaction_length
=352
# original_commit_timestamp=1769604026938975 (2026-01-28 21:40:26.938975 대한민국 표준시)
# immediate_commit_timestamp=1769604026938975 (2026-01-28 21:40:26.938975 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026938975*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 67913
#260128 21:40:26 server id 1  end_log_pos 68186 CRC32 0xcd520078 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
35
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES 
`Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
/*!*/;
# at 68186
#260128 21:40:26 server id 1  end_log_pos 68265 CRC32 0xe4e65cd0 	Anonymous_GTID	last_committed=88	sequence_number=89	r
br_only=no	original_committed_timestamp=1769604026958608	immediate_commit_timestamp=1769604026958608	transaction_length
=322
# original_commit_timestamp=1769604026958608 (2026-01-28 21:40:26.958608 대한민국 표준시)
# immediate_commit_timestamp=1769604026958608 (2026-01-28 21:40:26.958608 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026958608*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 68265
#260128 21:40:26 server id 1  end_log_pos 68508 CRC32 0x7732b8d8 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
36
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE C
ASCADE ON UPDATE CASCADE
/*!*/;
# at 68508
#260128 21:40:26 server id 1  end_log_pos 68587 CRC32 0xbdb2859d 	Anonymous_GTID	last_committed=89	sequence_number=90	r
br_only=no	original_committed_timestamp=1769604026983111	immediate_commit_timestamp=1769604026983111	transaction_length
=322
# original_commit_timestamp=1769604026983111 (2026-01-28 21:40:26.983111 대한민국 표준시)
# immediate_commit_timestamp=1769604026983111 (2026-01-28 21:40:26.983111 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604026983111*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 68587
#260128 21:40:26 server id 1  end_log_pos 68830 CRC32 0x46683fff 	Query	thread_id=119	exec_time=0	error_code=0	Xid = 79
37
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE C
ASCADE ON UPDATE CASCADE
/*!*/;
# at 68830
#260128 21:40:26 server id 1  end_log_pos 68909 CRC32 0x60b6911c 	Anonymous_GTID	last_committed=90	sequence_number=91	r
br_only=no	original_committed_timestamp=1769604027004946	immediate_commit_timestamp=1769604027004946	transaction_length
=323
# original_commit_timestamp=1769604027004946 (2026-01-28 21:40:27.004946 대한민국 표준시)
# immediate_commit_timestamp=1769604027004946 (2026-01-28 21:40:27.004946 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604027004946*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 68909
#260128 21:40:26 server id 1  end_log_pos 69153 CRC32 0xffdae7f1 	Query	thread_id=119	exec_time=1	error_code=0	Xid = 79
38
SET TIMESTAMP=1769604026/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE S
ET NULL ON UPDATE CASCADE
/*!*/;
# at 69153
#260128 21:43:00 server id 1  end_log_pos 69230 CRC32 0x475b9562 	Anonymous_GTID	last_committed=91	sequence_number=92	r
br_only=no	original_committed_timestamp=1769604180129836	immediate_commit_timestamp=1769604180129836	transaction_length
=235
# original_commit_timestamp=1769604180129836 (2026-01-28 21:43:00.129836 대한민국 표준시)
# immediate_commit_timestamp=1769604180129836 (2026-01-28 21:43:00.129836 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604180129836*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 69230
#260128 21:43:00 server id 1  end_log_pos 69388 CRC32 0x948d84f4 	Query	thread_id=126	exec_time=0	error_code=0	Xid = 81
66
SET TIMESTAMP=1769604180/*!*/;
DROP INDEX `Notification_targetUserId_idx` ON `notification`
/*!*/;
# at 69388
#260128 21:43:00 server id 1  end_log_pos 69465 CRC32 0xe92c1710 	Anonymous_GTID	last_committed=92	sequence_number=93	r
br_only=no	original_committed_timestamp=1769604180133963	immediate_commit_timestamp=1769604180133963	transaction_length
=227
# original_commit_timestamp=1769604180133963 (2026-01-28 21:43:00.133963 대한민국 표준시)
# immediate_commit_timestamp=1769604180133963 (2026-01-28 21:43:00.133963 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604180133963*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 69465
#260128 21:43:00 server id 1  end_log_pos 69615 CRC32 0x36ef9629 	Query	thread_id=126	exec_time=0	error_code=0	Xid = 81
67
SET TIMESTAMP=1769604180/*!*/;
DROP INDEX `Notification_type_idx` ON `notification`
/*!*/;
# at 69615
#260128 21:43:00 server id 1  end_log_pos 69694 CRC32 0x8c3508ef 	Anonymous_GTID	last_committed=93	sequence_number=94	r
br_only=no	original_committed_timestamp=1769604180152885	immediate_commit_timestamp=1769604180152885	transaction_length
=503
# original_commit_timestamp=1769604180152885 (2026-01-28 21:43:00.152885 대한민국 표준시)
# immediate_commit_timestamp=1769604180152885 (2026-01-28 21:43:00.152885 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604180152885*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 69694
#260128 21:43:00 server id 1  end_log_pos 70118 CRC32 0x37697492 	Query	thread_id=126	exec_time=0	error_code=0	Xid = 81
68
SET TIMESTAMP=1769604180/*!*/;
/*!80013 SET @@session.sql_require_primary_key=0*//*!*/;
ALTER TABLE `notification` DROP COLUMN `senderPartner`,
    DROP COLUMN `targetUserId`,
    ADD COLUMN `senderId` VARCHAR(191) NULL,
    ADD COLUMN `senderType` VARCHAR(191) NOT NULL,
    ADD COLUMN `targetType` VARCHAR(191) NOT NULL,
    MODIFY `message` VARCHAR(191) NOT NULL,
    MODIFY `senderName` VARCHAR(191) NOT NULL
/*!*/;
# at 70118
#260128 21:43:00 server id 1  end_log_pos 70197 CRC32 0x10982373 	Anonymous_GTID	last_committed=94	sequence_number=95	r
br_only=no	original_committed_timestamp=1769604180162187	immediate_commit_timestamp=1769604180162187	transaction_length
=263
# original_commit_timestamp=1769604180162187 (2026-01-28 21:43:00.162187 대한민국 표준시)
# immediate_commit_timestamp=1769604180162187 (2026-01-28 21:43:00.162187 대한민국 표준시)
/*!80001 SET @@session.original_commit_timestamp=1769604180162187*//*!*/;
/*!80014 SET @@session.original_server_version=80406*//*!*/;
/*!80014 SET @@session.immediate_server_version=80406*//*!*/;
# at 70197
#260128 21:43:00 server id 1  end_log_pos 70381 CRC32 0xc157db21 	Query	thread_id=126	exec_time=0	error_code=0	Xid = 81
69
SET TIMESTAMP=1769604180.156475/*!*/;
CREATE INDEX `Notification_targetType_idx` ON `Notification`(`targetType`)
/*!*/;
DELIMITER ;
# End of log file


