
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[taxonomy_json](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[taxnode_id] [int] NULL,
	[child_counts] [nvarchar](1000) NULL,
	[child_json] [nvarchar](max) NULL,
	[has_assigned_siblings] [bit] NULL,
	[has_species] [bit] NULL,
	[has_unassigned_siblings] [nchar](10) NULL,
	[is_ghost_node] [bit] NOT NULL,
	[json] [nvarchar](max) NULL,
	[parent_distance] [int] NULL,
	[parent_id] [int] NULL,
	[parent_taxnode_id] [int] NULL,
	[rank_index] [int] NOT NULL,
	[source] [char](1) NULL,
	[tree_id] [int] NULL,
 CONSTRAINT [PK_taxonomy_json] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO


