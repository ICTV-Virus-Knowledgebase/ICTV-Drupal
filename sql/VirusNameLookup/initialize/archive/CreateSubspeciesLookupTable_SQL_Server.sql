

CREATE TABLE [dbo].[subspecies_lookup](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[ictv_msl] [int] NULL,
	[ictv_rank] [varchar](20) NULL,
	[ictv_taxnode_id] [int] NULL,
	[name] [nvarchar](500) NOT NULL,
	[parent_name] [nvarchar](500) NULL,
	[parent_rank] [varchar](20) NULL,
	[parent_tax_id] [int] NULL,
	[rank_name] [varchar](20) NOT NULL,
	[tax_id] [int] NULL,
 CONSTRAINT [PK_subspecies_lookup] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
