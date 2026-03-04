import React, { useMemo, useState } from 'react';
import { ExternalLink, User, Search, Filter } from 'lucide-react';

const HANDBOOK_CONTENT = `
# The Data Engineering Handbook
<a href="https://trendshift.io/repositories/8755" target="_blank"><img src="https://trendshift.io/api/badge/repositories/8755" alt="DataExpert-io%2Fdata-engineer-handbook | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

This repo has all the resources you need to become an amazing data engineer!

## Getting started

If you are new to data engineering, start by following this [2024 breaking into data engineering roadmap](https://blog.dataengineer.io/p/the-2024-breaking-into-data-engineering)

If you are here for the [4-week free beginner boot camp](https://learn.dataexpert.io/program/the-absolute-beginner-data-engineering-boot-camp-starting-august-7th-6453/details) you can check out:
- [introduction](beginner-bootcamp/introduction.md)
- [software needed](beginner-bootcamp/software.md)

If you are here for the [6-week free intermediate boot camp](https://learn.dataexpert.io/program/free-community-boot-camp/details) you can check out
- [introduction](intermediate-bootcamp/introduction.md)
- [software needed](intermediate-bootcamp/software.md)


For more applied learning:
- Check out the [projects](projects.md) section for more hands-on examples!
- Check out the [interviews](interviews.md) section for more advice on how to pass data engineering interviews!
- Check out the [books](books.md) section for a list of high quality data engineering books
- Check out the [communities](communities.md) section for a list of high quality data engineering communities to join
- Check out the [newsletter](newsletters.md) section to learn via email 


## Resources

### Great [list of over 25 books](books.md)

Top 3 must read books are:
- [Fundamentals of Data Engineering](https://www.amazon.com/Fundamentals-Data-Engineering-Robust-Systems/dp/1098108302/)
- [Designing Data-Intensive Applications](https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321/)
- [Designing Machine Learning Systems](https://www.amazon.com/Designing-Machine-Learning-Systems-Production-Ready/dp/1098107969)

### Great [list of over 10 communities to join](communities.md):

Top must-join communities for DE:
- [DataExpert.io Community Discord](https://discord.gg/JGumAXncAK)
- [Data Talks Club Slack](https://datatalks.club/slack)
- [Data Engineer Things Community](https://www.dataengineerthings.org/)

Top must-join communities for ML:
- [AdalFlow Discord](https://discord.com/invite/ezzszrRZvT)
- [Chip Huyen MLOps Discord](https://discord.gg/dzh728c5t3)

### Companies:

- Orchestration  
  - [Mage](https://www.mage.ai)
  - [Astronomer](https://www.astronomer.io)
  - [Prefect](https://www.prefect.io)
  - [Dagster](https://www.dagster.io)
  - [Airflow](https://airflow.apache.org/)
  - [Kestra](https://kestra.io/) 
  - [Shipyard](https://www.shipyardapp.com/)
  - [Hamilton](https://github.com/dagworks-inc/hamilton)
- Data Lake / Cloud
  - [Tabular](https://www.tabular.io)
  - [Microsoft](https://www.microsoft.com)
  - [Databricks](https://www.databricks.com/company/about-us)
  - [Onehouse](https://www.onehouse.ai)
  - [Delta Lake](https://delta.io/)
  - [Ilum](https://ilum.cloud/)
  - [DuckLake](https://ducklake.select/)
  - [Apache Iceberg](https://iceberg.apache.org/)
  - [Apache Polaris](https://polaris.apache.org/)
  - [Lakekeeper](https://lakekeeper.io/)
- Data Warehouse
  - [Snowflake](https://www.snowflake.com/en/)
  - [Firebolt](https://www.firebolt.io/)
  - [Databend](https://www.databend.com/)
- Data Quality
  - [dbt](https://www.getdbt.com/)
  - [Metaplane](https://www.metaplane.dev/)
  - [Gable](https://www.gable.ai)
  - [Great Expectations](https://www.greatexpectations.io)
  - [Streamdal](https://streamdal.com)
  - [Coalesce](https://coalesce.io/)
  - [Soda](https://www.soda.io/)
  - [DQOps](https://dqops.com/)
  - [HEDDA.IO](https://hedda.io)
  - [Dingo](https://github.com/MigoXLab/dingo)
- Education Companies
  - [DataExpert.io](https://www.dataexpert.io)
  - [LearnDataEngineering.com](https://www.learndataengineering.com)
  - [AlgoExpert](https://www.algoexpert.io)
  - [ByteByteGo](https://www.bytebytego.com)
- Analytics / Visualization
  - [Preset](https://www.preset.io)
  - [Starburst](https://www.starburst.io)
  - [Metabase](https://www.metabase.com/)
  - [Looker Studio](https://lookerstudio.google.com/overview)
  - [Tableau](https://www.tableau.com/)
  - [Power BI](https://powerbi.microsoft.com/)
  - [Hex](https://hex.ai/)
  - [Apache Superset](https://superset.apache.org/)
  - [Evidence](https://evidence.dev)
  - [Redash](https://redash.io/)
  - [Lightdash](https://lightdash.com/)
- Data Integration
  - [Cube](https://cube.dev)
  - [Fivetran](https://www.fivetran.com)
  - [Airbyte](https://airbyte.io)
  - [dlt](https://dlthub.com/)
  - [Sling](https://slingdata.io/)
  - [Meltano](https://meltano.com/)
  - [Estuary](https://estuary.dev/)
- Semantic Layers
  - [Cube](https://cube.dev)
  - [dbt Semantic Layer](https://www.getdbt.com/product/semantic-layer) 
- Modern OLAP
  - [Apache Druid](https://druid.apache.org/)
  - [ClickHouse](https://clickhouse.com/)
  - [Apache Pinot](https://pinot.apache.org/)
  - [Apache Kylin](https://kylin.apache.org/)
  - [DuckDB](https://duckdb.org/)
  - [QuestDB](https://questdb.io/)
  - [StarRocks](https://www.starrocks.io/)
- LLM application library
  - [AdalFlow](https://github.com/SylphAI-Inc/AdalFlow)
  - [LangChain](https://github.com/langchain-ai/langchain)
  - [LlamaIndex](https://github.com/run-llama/llama_index)
- Real-Time Data
  - [Aggregations.io](https://aggregations.io)
  - [Responsive](https://www.responsive.dev/)
  - [RisingWave](https://risingwave.com/)
  - [Striim](https://www.striim.com/)
- Data Lineage
  - [OpenLineage](https://openlineage.io/)


### Data Engineering blogs of companies:

- [Netflix](https://netflixtechblog.com/tagged/big-data)
- [Uber](https://www.uber.com/blog/houston/data/?uclick_id=b2f43229-f3f4-4bae-bd5d-10a05db2f70c)
- [Databricks](https://www.databricks.com/blog/category/engineering/data-engineering)
- [Airbnb](https://medium.com/airbnb-engineering/data/home)
- [Amazon AWS Blog](https://aws.amazon.com/blogs/big-data/)
- [Microsoft Data Architecture Blogs](https://techcommunity.microsoft.com/t5/data-architecture-blog/bg-p/DataArchitectureBlog)
- [Microsoft Fabric Blog](https://blog.fabric.microsoft.com/)
- [Oracle](https://blogs.oracle.com/datawarehousing/)
- [Meta](https://engineering.fb.com/category/data-infrastructure/)
- [Onehouse](https://www.onehouse.ai/blog)
- [Estuary Blog](https://estuary.dev/blog/)

### Data Engineering Whitepapers:

- [A Five-Layered Business Intelligence Architecture](https://ibimapublishing.com/articles/CIBIMA/2011/695619/695619.pdf)
- [Lakehouse:A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf)
- [Big Data Quality: A Data Quality Profiling Model](https://link.springer.com/chapter/10.1007/978-3-030-23381-5_5)
- [The Data Lakehouse: Data Warehousing and More](https://arxiv.org/abs/2310.08697)
- [Spark: Cluster Computing with Working Sets](https://dl.acm.org/doi/10.5555/1863103.1863113)
- [The Google File System](https://research.google/pubs/the-google-file-system/)
- [Building a Universal Data Lakehouse](https://www.onehouse.ai/whitepaper/onehouse-universal-data-lakehouse-whitepaper)
- [XTable in Action: Seamless Interoperability in Data Lakes](https://arxiv.org/abs/2401.09621)
- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/)
- [Tidy Data](https://vita.had.co.nz/papers/tidy-data.pdf)
- [Data Engineering Whitepapers](https://www.ssp.sh/brain/data-engineering-whitepapers/)

### Social Media Accounts

Here's the mostly comprehensive list of data engineering creators: 
**(You have to have at least 5k followers somewhere to be added!)**


#### YouTube 
| Name                        | YouTube Channel                                                                                         | Follower Count |
|----------------------------|---------------------------------------------------------------------------------------------------------|---------------:|
| ByteByteGo                 | [ByteByteGo](https://www.youtube.com/c/ByteByteGo)                                             | 1,000,000+     |
| Data with Baraa            | [Data with Baraa](https://www.youtube.com/@DataWithBaraa)                                       | 195,000+     |
| Zach Wilson                | [Data with Zach](https://www.youtube.com/@eczachly_)                                          | 150,000+       |
| Shashank Mishra            | [E-learning Bridge](https://www.youtube.com/@shashank_mishra)                                   | 100,000+       |
| Seattle Data Guy           | [Seattle Data Guy](https://www.youtube.com/c/SeattleDataGuy)                                  | 100,000+       |
| TrendyTech                 | [TrendyTech](https://www.youtube.com/c/TrendytechInsights)                                   | 100,000+       |
| Darshil Parmar             | [Darshil Parmar](https://www.youtube.com/@DarshilParmar)                                       | 100,000+       |
| Andreas Kretz              | [Andreas Kretz](https://www.youtube.com/c/andreaskayy)                                          | 100,000+       |
| The Ravit Show             | [The Ravit Show](https://youtube.com/@theravitshow)                                           | 100,000+       |
| Guy in a Cube              | [Guy in a Cube](https://www.youtube.com/@GuyInACube)                                            | 100,000+       |
| Adam Marczak               | [Adam Marczak](https://www.youtube.com/@AdamMarczakYT)                                         | 100,000+       |
| nullQueries                | [nullQueries](https://www.youtube.com/@nullQueries)                                             | 100,000+       |
| TECHTFQ by Thoufiq         | [TECHTFQ by Thoufiq](https://www.youtube.com/@techTFQ)                                         | 100,000+       |
| SQLBI                       | [SQLBI](https://www.youtube.com/@SQLBI)                                                     | 100,000+       |
| Alex Freberg               | [Alex The Analyst](https://www.youtube.com/@AlexTheAnalyst)                                     | 100,000+       |
| Ankur Ranjan               | [Big Data Show](https://www.youtube.com/@TheBigDataShow)                                        | 100,000+       |
| Prashanth Kumar Pandey     | [ScholarNest](https://www.youtube.com/@ScholarNest)                                              | 77,000+        |
| ITVersity                  | [ITVersity](https://www.youtube.com/@itversity)                                                  | 67,000+        |
| Soumil Shah                | [Soumil Shah](https://www.youtube.com/@SoumilShah)                                               | 50,000         |
| Ansh Lamba                 | [Ansh Lamba](https://www.youtube.com/@AnshLambaJSR)                                              | 18,000+        |
| Azure Lib                  | [Azure Lib](https://www.youtube.com/@azurelib-academy)                                        | 10,000+        |
| Advancing Analytics        | [Advancing Analytics](https://www.youtube.com/@AdvancingAnalytics)                               | 10,000+        |
| Kahan Data Solutions       | [Kahan Data Solutions](https://www.youtube.com/@KahanDataSolutions)                               | 10,000+        |
| Ankit Bansal               | [Ankit Bansal](https://youtube.com/@ankitbansal6)                                               | 10,000+        |
| Mr. K Talks Tech           | [Mr. K Talks Tech](https://www.youtube.com/channel/UCzdOan4AmF65PmLLks8Lmww)                      | 10,000+        |
| Samuel Focht               | [Python Basics](https://www.youtube.com/@PythonBasics)                                           | 10,000+        |
| Mehdi Ouazza              | [Mehdio DataTV](https://www.youtube.com/@mehdio)                                                    | 3,000+         |
| Alex Merced                | [Alex Merced Data](https://www.youtube.com/@alexmerceddata_)                                            | N/A           |
| John Kutay                 | [John Kutay](https://www.youtube.com/@striiminc) | N/A           |
| Emil Kaminski              | [Databricks For Professionals](https://www.youtube.com/@DatabricksPro)                           | 5,000+          |

#### LinkedIn

| Name                      | LinkedIn Profile                                                                                         | Follower Count |
|--------------------------|----------------------------------------------------------------------------------------------------------|---------------:|
| Zach Wilson              | [Zach Wilson](https://www.linkedin.com/in/eczachly)                                                     | 400,000+       |
| Chip Huyen               | [Chip Huyen](https://www.linkedin.com/in/chiphuyen/)                                    | 250,000+       |
| Shashank Mishra          | [Shashank Mishra](https://www.linkedin.com/in/shashank219/)                                     | 100,000+       |
| Seattle Data Guy         | [Ben Rogojan](https://www.linkedin.com/in/benjaminrogojan)                                        | 100,000+       |
| TrendyTech               | [Sumit Mittal](https://www.linkedin.com/in/bigdatabysumit/)                                   | 100,000+       |
| Darshil Parmar           | [Darshil Parmar](https://www.linkedin.com/in/darshil-parmar/)                                   | 100,000+       |
| Andreas Kretz            | [Andreas Kretz](https://www.linkedin.com/in/andreas-kretz)                                     | 100,000+       |
| ByteByteGo (Alex Xu)     | [Alex Xu](https://www.linkedin.com/in/alexxubyte)                                             | 100,000+       |
| Azure Lib (Deepak Goyal) | [Deepak Goyal](https://www.linkedin.com/in/deepak-goyal-93805a17/)                              | 100,000+       |
| Alex Freberg             | [Alex Freberg](https://www.linkedin.com/in/alex-freberg/)                                     | 100,000+       |
| SQLBI (Marco Russo)      | [Marco Russo](https://www.linkedin.com/in/sqlbi)                                                  | 50,000+        |
| Ankit Bansal             | [Ankit Bansal](https://www.linkedin.com/in/ankitbansal6/)                                        | 50,000+        |
| Marc Lamberti            | [Marc Lamberti](https://www.linkedin.com/in/marclamberti)                                       | 50,000+        |
| Ankur Ranjan             | [Ankur Ranjan](https://www.linkedin.com/in/thebigdatashow/)                                       | 48,000+        |
| ITVersity (Durga Gadiraju)| [Durga Gadiraju](https://www.linkedin.com/in/durga0gadiraju/)                                   | 48,000+        |
| Prashanth Kumar Pandey   | [Prashanth Kumar Pandey](https://www.linkedin.com/in/prashant-kumar-pandey/)                       | 37,000+        |
| Alex Merced              | [Alex Merced](https://www.linkedin.com/in/alexmerced)                                           | 30,000+        |
| Ijaz Ali                 | [Ijaz Ali](https://www.linkedin.com/in/ijaz-ali-6aaa87122/)                                       | 24,000+        |
| Mehdi Ouazza             | [Mehdi Ouazza](https://www.linkedin.com/in/mehd-io/)                                        | 20,000+        |
| Ananth Packkildurai      | [Ananth Packkildurai](https://www.linkedin.com/in/ananthdurai/)                                    | 18,000+        |
| Ansh Lamba               | [Ansh Lamba](https://www.linkedin.com/in/ansh-lamba-793681184/)                                    | 13,000+        |
| Manojkumar Vadivel       | [Manojkumar Vadivel](https://www.linkedin.com/in/manojvsj/)                                        | 12,000+        |
| Advancing Analytics      | [Simon Whiteley](https://www.linkedin.com/in/simon-whiteley-uk/)                                  | 10,000+        |
| Li Yin                   | [Li Yin](https://www.linkedin.com/in/li-yin-ai/)                                                  | 10,000+        |
| Jaco van Gelder          | [Jaco van Gelder](https://www.linkedin.com/in/jwvangelder/)                                       | 10,000+        |
| Joseph Machado           | [Joseph Machado](https://www.linkedin.com/in/josephmachado1991/)                                  | 10,000+        |
| Eric Roby                | [Eric Roby](https://www.linkedin.com/in/codingwithroby/)                                           | 10,000+        |
| Simon Späti              | [Simon Späti](https://www.linkedin.com/in/sspaeti/)                                            | 10,000+        |
| Constantin Lungu         | [Constantin Lungu](https://www.linkedin.com/in/constantin-lungu-668b8756)                         | 10,000+        |
| Lakshmi Sontenam         | [Lakshmi Sontenam](https://www.linkedin.com/in/shivaga9esh)                                      | 9,500+         |
| Dani Pálma               | [Daniel Pálma](https://www.linkedin.com/in/danthelion/)                                          | 9,000+         |
| Soumil Shah              | [Soumil Shah](https://www.linkedin.com/in/shah-soumil/)                                          | 8,000+         |
| Arnaud Milleker          | [Arnaud Milleker](https://www.linkedin.com/in/arnaudmilleker/)                                    | 7,000+         |
| Dimitri Visnadi          | [Dimitri Visnadi](https://www.linkedin.com/in/visnadi/)                                    | 7,000+         |
| Lenny                    | [Lenny A](https://www.linkedin.com/in/lennyardiles/)                                         | 6,000+         |
| Dipankar Mazumdar        | [Dipankar Mazumdar](https://www.linkedin.com/in/dipankar-mazumdar/)                                 | 5,000+         |
| Daniel Ciocirlan         | [Daniel Ciocirlan](https://www.linkedin.com/in/danielciocirlan)                                    | 5,000+         |
| Hugo Lu                  | [Hugo Lu](https://www.linkedin.com/in/hugo-lu-confirmed/)                                           | 5,000+         |
| Tobias Macey             | [Tobias Macey](https://www.linkedin.com/in/tmacey)                                                 | 5,000+         |
| Marcos Ortiz             | [Marcos Ortiz](https://www.linkedin.com/in/mlortiz)                                             | 5,000+         |
| Julien Hurault           | [Julien Hurault](https://www.linkedin.com/in/julienhuraultanalytics/)                               | 5,000+         |
| John Kutay               | [John Kutay](https://www.linkedin.com/in/johnkutay/)                                               | 5,000+         |
| Hassaan Akbar            | [Hassaan Akbar](https://www.linkedin.com/in/ehassaan)                                              | 5,000+         |
| Subhankar                | [Subhankar](https://www.linkedin.com/in/subhankarumass/)                                            | 5,000+         |
| Nitin                    | [Nitin](https://www.linkedin.com/in/tomernitin29/)                                                        | N/A           |
| Hassaan                    | [Hassaan](https://www.linkedin.com/in/shassaan/)                                                        | 5000+           |
| Javier de la Torre             | [Javier](www.linkedin.com/in/javier-de-la-torre-medina)                                                        | 5000+           |


#### X/Twitter

| Name              | X/Twitter Profile                                                 | Follower Count |
|-------------------|------------------------------------------------------------------|---------------:|
| ByteByteGo        | [alexxubyte](https://twitter.com/alexxubyte/)            | 100,000+       |
| Dan Kornas        | [@dankornas](https://www.twitter.com/dankornas)           | 66,000+        |
| Zach Wilson       | [EcZachly](https://www.twitter.com/EcZachly)          | 30,000+        |
| Seattle Data Guy  | [SeattleDataGuy](https://www.twitter.com/SeattleDataGuy)   | 10,000+        |
| SQLBI             | [marcorus](https://x.com/marcorus)                       | 10,000+        |
| Joseph Machado    | [startdataeng](https://twitter.com/startdataeng)         | 5,000+         |
| Alex Merced       | [@amdatalakehouse](https://www.twitter.com/amdatalakehouse)      | N/A           |
| John Kutay        | [@JohnKutay](https://x.com/JohnKutay)                            | N/A           |
| Mehdi Ouazza      | [mehd_io](https://x.com/mehd_io)                                 | N/A           |


#### Instagram

| Name           | Instagram Profile                                                                   | Follower Count |
|----------------|--------------------------------------------------------------------------------------|---------------:|
| Sundas Khalid  | [sundaskhalidd](https://www.instagram.com/sundaskhalidd)                              | 300,000+       |
| Zach Wilson    | [eczachly](https://www.instagram.com/eczachly)                             | 150,000+       |
| Andreas Kretz  | [learndataengineering](https://www.instagram.com/learndataengineering)          | 5,000+         |
| Alex Merced    | [@alexmercedcoder](https://www.instagram.com/alexmercedcoder)                       | N/A           |

#### TikTok

| Name            | TikTok Profile                                                                   | Follower Count |
|-----------------|----------------------------------------------------------------------------------|---------------:|
| Zach Wilson     | [@eczachly](https://www.tiktok.com/@eczachly)                            | 70,000+        |
| Alex Freberg    | [@alex_the_analyst](https://www.tiktok.com/@alex_the_analyst)             | 10,000+        |
| Mehdi Ouazza    | [@mehdio_datatv](https://www.tiktok.com/@mehdio_datatv)                          | N/A           |


### Great Podcasts

- [The Data Engineering Show](https://www.dataengineeringshow.com/)
- [Data Engineering Podcast](https://www.dataengineeringpodcast.com/)
- [DataTopics](https://www.datatopics.io/)
- [The Data Engineering Side Of Data](https://podcasts.apple.com/us/podcast/the-engineering-side-of-data/id1566999533)
- [DataWare](https://www.ascend.io/dataaware-podcast/)
- [The Data Coffee Break Podcast](https://www.deezer.com/us/show/5293247)
- [The Datastack show](https://datastackshow.com/)
- [Intricity101 Data Sharks Podcast](https://www.intricity.com/learningcenter/podcast)
- [Drill to Detail with Mark Rittman](https://www.rittmananalytics.com/drilltodetail/)
- [Analytics Power Hour](https://analyticshour.io/)
- [Catalog & cocktails](https://listen.casted.us/public/127/Catalog-%26-Cocktails-2fcf8728)
- [Datatalks](https://datatalks.club/podcast.html)
- [Data Brew by Databricks](https://www.databricks.com/discover/data-brew)
- [The Data Cloud Podcast by Snowflake](https://rise-of-the-data-cloud.simplecast.com/)
- [What's New in Data](https://www.striim.com/podcast/)
- [Open||Source||Data by Datastax](https://www.datastax.com/resources/podcast/open-source-data)
- [Streaming Audio by confluent](https://developer.confluent.io/podcast/)
- [The Data Scientist Show](https://podcasts.apple.com/us/podcast/the-data-scientist-show/id1584430381)
- [MLOps.community](https://podcast.mlops.community/)
- [Monday Morning Data Chat](https://open.spotify.com/show/3Km3lBNzJpc1nOTJUtbtMh)
- [The Data Chief](https://www.thoughtspot.com/data-chief/podcast)
- [The Joe Reis Show](https://open.spotify.com/show/3mcKitYGS4VMG2eHd2PfDN)
- [Data Bytes](https://open.spotify.com/show/6VbjON5Ck9QYInBnmoqrDE)
- [Super Data Science: ML & AI Podcast with Jon Krohn](https://open.spotify.com/show/1n8P7ZSgfVLVJ3GegxPat1)

### Great [list of 20+ newsletters](newsletters.md)

Top must follow newsletters for data engineering:
- [DataEngineer.io Newsletter](https://blog.dataengineer.io)
- [Joe Reis](https://joereis.substack.com)
- [Start Data Engineering](https://www.startdataengineering.com)
- [Data Engineering Weekly](https://www.dataengineeringweekly.com)
- [Data Engineer Things](https://dataengineerthings.substack.com/)

### Glossaries:
- [Data Engineering Vault](https://www.ssp.sh/brain/data-engineering/)
- [Airbyte Data Glossary](https://glossary.airbyte.com/)
- [Data Engineering Wiki by Reddit](https://dataengineering.wiki/Index)
- [Seconda Glossary](https://www.secoda.co/glossary/)
- [Glossary Databricks](https://www.databricks.com/glossary)
- [Airtable Glossary](https://airtable.com/shrGh8BqZbkfkbrfk/tbluZ3ayLHC3CKsDb)
- [Data Engineering Glossary by Dagster](https://dagster.io/glossary)


### Design Patterns

- [Cumulative Table Design](https://www.github.com/DataExpert-io/cumulative-table-design)
- [Microbatch Deduplication](https://www.github.com/EcZachly/microbatch-hourly-deduped-tutorial)
- [The Little Book of Pipelines](https://www.github.com/EcZachly/little-book-of-pipelines)
- [Data Developer Platform](https://datadeveloperplatform.org/architecture/)

### Courses / Academies

- [DataExpert.io course](https://www.dataexpert.io) use code **HANDBOOK10** for a discount!
- [LearnDataEngineering.com](https://www.learndataengineering.com)
- [Technical Freelancer Academy](https://www.technicalfreelanceracademy.com/) Use code **zwtech** for a discount!
- [IBM Data Engineering for Everyone](https://www.edx.org/learn/data-engineering/ibm-data-engineering-basics-for-everyone)
- [Qwiklabs](https://www.qwiklabs.com/)
- [DataCamp](https://www.datacamp.com/)
- [Udemy Courses from Shruti Mantri](https://www.udemy.com/user/shruti-mantri-5/)
- [Rock the JVM](https://rockthejvm.com/) teaches Spark (in Scala), Flink and others
- [Data Engineering Zoomcamp by DataTalksClub](https://datatalks.club/)
- [Efficient Data Processing in Spark](https://josephmachado.podia.com/efficient-data-processing-in-spark)
- [Scaler](https://www.scaler.com/)
- [DataTeams - Data Engingeer hiring platform](https://www.datateams.ai/)
- [Udemy Courses from Daniel Blanco](https://danielblanco.dev/links)
- [DeepLearning.AI Data Engineering Professional Certificate](https://www.coursera.org/professional-certificates/data-engineering)

### Certifications Courses

- [Google Cloud Certified - Professional Data Engineer](https://cloud.google.com/certification/data-engineer)
- [Databricks - Certified Associate Developer for Apache Spark](https://www.databricks.com/learn/certification/apache-spark-developer-associate)
- [Databricks - Data Engineer Associate](https://www.databricks.com/learn/certification/data-engineer-associate)
- [Databricks - Data Engineer Professional](https://www.databricks.com/learn/certification/data-engineer-professional)
- [Microsoft DP-203: Data Engineering on Microsoft Azure](https://learn.microsoft.com/en-us/credentials/certifications/exams/dp-203/?tab=tab-learning-paths)
- [Microsoft DP-600: Fabric Analytics Engineer Associate](https://learn.microsoft.com/credentials/certifications/fabric-analytics-engineer-associate/)
- [Microsoft DP-700: Fabric Data Engineer Associate](https://learn.microsoft.com/en-us/credentials/certifications/fabric-data-engineer-associate/?practice-assessment-type=certification)
- [AWS Certified Data Engineer - Associate](https://aws.amazon.com/certification/certified-data-engineer-associate/)
`;

interface Project {
  category: string;
  developer: string;
  name: string;
  link: string;
  description: string;
}

const parseHandbookContent = (markdown: string): Project[] => {
  const lines = markdown.split('\n');
  const projects: Project[] = [];
  
  let currentSection = 'Resources';
  let currentSubSection = '';
  
  // Helper to clean markdown links from section titles
  const cleanSectionTitle = (text: string) => {
    // Remove links [text](url) -> text
    let cleaned = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Remove # and trim
    cleaned = cleaned.replace(/^#+/, '').trim();
    // Remove trailing colons
    cleaned = cleaned.replace(/:$/, '');
    return cleaned;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Header Detection (Section)
    if (line.startsWith('#')) {
      // If it's #### (Level 4), treat as subsection
      if (line.startsWith('####')) {
        currentSubSection = cleanSectionTitle(line);
      } else {
        // Level 1-3 (#, ##, ###), treat as main section
        currentSection = cleanSectionTitle(line);
        currentSubSection = ''; // Reset subsection
      }
      continue;
    }

    // List Item Detection (- [Name](Url))
    // Special handling for nested lists in "Companies" section which uses indentation
    if (line.startsWith('- ')) {
      // Check if it's a category item (no link, just text) inside Companies section?
      // Actually in Companies section: 
      // - Orchestration
      //   - [Mage](...)
      // The indentation in the file might be spaces.
      // But `line` is trimmed.
      // Let's check the original indentation from `lines[i]`.
      
      const originalLine = lines[i];
      const indentation = originalLine.search(/\S/);
      
      const content = line.substring(2).trim();
      
      // Check if it contains a link
      const linkMatch = content.match(/\[(.*?)\]\((.*?)\)/);
      
      if (linkMatch) {
        // It's a project/resource
        const name = linkMatch[1];
        const link = linkMatch[2];
        let description = '';
        
        // Check for description after link " - description"
        const afterLink = content.replace(linkMatch[0], '').trim();
        if (afterLink.startsWith('-') || afterLink.startsWith(':')) {
           description = afterLink.substring(1).trim();
        }

        // Determine category
        let category = currentSection;
        if (currentSubSection) {
          category = `${currentSection} - ${currentSubSection}`;
        } else if (indentation >= 2 && currentSection === 'Companies') {
           // It's a nested item in Companies, but we need the parent category
           // We need to track the last non-link list item as sub-category for Companies
           // But since we iterate line by line, let's look back?
           // Or maintain a 'currentListCategory' state.
        }
        
        // For simplicity, if we are in Companies section, we might have missed the sub-category if we just look at indentation.
        // Let's try to capture the sub-category for Companies.
        // In the markdown:
        // - Orchestration
        //   - [Mage]...
        // So "Orchestration" is a list item without link.
        
        projects.push({
          category: category, // Will be refined below for Companies
          developer: '', // No developer info in this handbook mostly
          name: name,
          link: link,
          description: description
        });
      } else {
        // It might be a sub-category header (like "Orchestration" in Companies)
        if (currentSection === 'Companies') {
           currentSubSection = content;
        }
      }
    }
    
    // Table Row Detection (| Name | ...)
    if (line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      // Header row usually has "Name", "Profile", "Follower Count"
      if (parts[0] === 'Name' || parts[0].includes('-----')) continue;
      
      if (parts.length >= 2) {
         const name = parts[0];
         // Second column usually has link: [Name](url)
         const linkMatch = parts[1].match(/\[(.*?)\]\((.*?)\)/);
         const link = linkMatch ? linkMatch[2] : '';
         const displayName = linkMatch ? linkMatch[1] : parts[1];
         
         // 3rd column is follower count
         const followers = parts[2] || '';
         
         projects.push({
          category: `${currentSection} - ${currentSubSection}`,
          developer: displayName, // For social media, the name is the developer/creator
          name: displayName,
           link: link,
           description: `Followers: ${followers}`
         });
      }
    }
  }
  
  return projects;
};

const DataDeveloper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const projects = useMemo(() => parseHandbookContent(HANDBOOK_CONTENT), []);
  
  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map(p => p.category)));
    return ['All', ...cats];
  }, [projects]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [projects, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            数据开发者手册
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Data Engineering Handbook 资源精选
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="搜索项目、开发者或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <div key={index} className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 mb-2 truncate max-w-[80%]">
                    {project.category}
                  </span>
                  <a 
                    href={project.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {project.name}
                </h3>
                
                {project.developer && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <User className="h-4 w-4 mr-1" />
                    <span>{project.developer}</span>
                  </div>
                )}
                
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1 line-clamp-3">
                  {project.description}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center justify-center"
                >
                  访问资源 <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">没有找到相关项目</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">请尝试调整搜索关键词或类别过滤器。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDeveloper;
