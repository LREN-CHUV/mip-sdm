#!/bin/bash

# Generates the configuration settings starting from .patch.json file

variables_file=$1
mip_cde_variables_file=$2
: ${mip_cde_variables_file:=../mip-cde-meta-db-setup/variables.json}
target_table="besta_features"
dataset="besta_only"
migration_version="V1_3_1"
force_dataset_generation=true
view="mip_local_features"

if ! [ -f "$variables_file" ] ; then
  echo "Generates the configuration settings starting from .patch.json file"
  echo "Usage:"
  echo "  ./generate-data-settings.sh ../besta-meta-db-setup/besta.patch.json"
  echo "Please run this script from the root of your data project."
  exit 1
fi

echo

mkdir -p config/

cat << EOF > config/${target_table}_columns.properties
# suppress inspection "UnusedProperty" for whole file

# Name of the target table
__TABLE=${target_table^^}
# Columns of the table
__COLUMNS=subjectcode,$(cat $variables_file | jq  --raw-output '[(.. | objects | select(has("methodology")) | .code)] | sort | join(",")' )

# Description of the type and constraints for each column in the table
subjectcode.type=char(20)
subjectcode.constraints=is_index
EOF

cat $variables_file | jq --raw-output '
  def char_type(v):
    if (v|has("length")) then
      "char(" + (v.length|tostring) + ")"
    else
      "varchar(256)"
    end
  ;
  .. | objects | select(has("methodology")) | ( .code + ".type=" + (if has("sql_type") then
    .sql_type
  elif .type == "real" then
    "numeric"
  elif .type == "integer" then
    "int"
  elif .type == "binominal" then
    char_type(.)
  elif .type == "polynominal" then
    char_type(.)
  else
    char_type(.)
  end))' | sort >> config/${target_table}_columns.properties

echo "Generated config/${target_table}_columns.properties"

cat << EOF > config/${dataset}_dataset.properties
# suppress inspection "UnusedProperty" for whole file

# Name of the dataset
__DATASET=$dataset
# Name of the target table
__TABLE=${target_table^^}
# CSV file containing the data to inject in the table
__CSV_FILE=/data/${dataset}.csv
# SQL statement to remove all data from a previous execution
__DELETE_SQL=DELETE FROM ${target_table^^}
EOF

echo "Generated config/${dataset}_dataset.properties"

mkdir -p sql/

cat << EOF > sql/${migration_version}__${target_table}.sql
SET datestyle to 'European';

CREATE TABLE ${target_table^^}
(
    "subjectcode" char(20),
EOF

cat $variables_file | jq --raw-output '
  def char_type(v):
    if (v|has("length")) then
      "char(" + (v.length|tostring) + ")"
    else
      "varchar(256)"
    end
  ;
  .. | objects | select(has("methodology")) | ( "    !" + .code + "! " + (if has("sql_type") then
    .sql_type
  elif .type == "real" then
    "numeric"
  elif .type == "integer" then
    "int"
  elif .type == "binominal" then
    char_type(.)
  elif .type == "polynominal" then
    char_type(.)
  else
    char_type(.)
  end) + ",")' | tr "!" '"' | sort >> sql/${migration_version}__${target_table}.sql

cat << EOF >> sql/${migration_version}__${target_table}.sql

    CONSTRAINT pk_$target_table PRIMARY KEY (subjectcode)
)
WITH (
    OIDS=FALSE
);
EOF

echo "Generated sql/${migration_version}__${target_table}.sql"

if [ ! -f sql/$dataset.csv ] || [ $force_dataset_generation ]; then
  echo "subjectcode,$(cat $variables_file | jq  --raw-output '[(.. | objects | select(has("methodology")) | .code)] | sort | join(",")' )" > sql/$dataset.csv

  echo "Generated sql/$dataset.csv"
fi

cat << EOF > config/${view}_view.properties
# suppress inspection "UnusedProperty" for whole file

# Name of the view
__VIEW=${view^^}

# List of tables used in the view
__TABLES=mip_cde_features,$target_table

# Columns of the view
__COLUMNS=subjectcode,$(cat $mip_cde_variables_file | jq  --raw-output '[(.. | objects | select(has("methodology")) | .code)] | sort | join(",")' ),$(cat $variables_file | jq  --raw-output '[(.. | objects | select(has("methodology")) | .code)] | sort | join(",")' )

# Template of the SQL statements to execute to create the view
__SQL_TEMPLATE=join_view.mustache.sql

EOF

echo "Generated config/${view}_view.properties"
