import streamlit as st
import pandas as pd


# ---------------------------------------------------
# DEPARTMENT SHORT NAME MAPPING
# ---------------------------------------------------

def get_department_short_name(department):

    mapping = {

        "Mechanical Engineering": "MECH",

        "Electronics & Communication Engineering": "ECE",

        "Automobile Engineering": "AUTO",

        "Civil Engineering": "CIVIL",

        "Civil Engineering + Transportation Engineering": "CTRANS",

        "Civil and Transportation Engineering": "CTRANS",

        "Transportation Engineering": "CTRANS",

        "Electrical & Electronics Engineering": "EEE",

        "Computer Science Engineering": "CSE",

        "Information Technology": "IT",

        "Master of Computer Applications": "MCA",

        "MCA": "MCA"

    }

    return mapping.get(
        str(department).strip(),
        str(department).strip()
    )


# ---------------------------------------------------
# IMPORT PAGE
# ---------------------------------------------------

def render_import_page(db):

    st.title("Import Pre-Registered Alumni")

    uploaded_file = st.file_uploader(
        "Upload Excel File",
        type=["xlsx"]
    )

    if uploaded_file:

        try:

            # -----------------------------------------
            # READ EXCEL
            # -----------------------------------------

            df = pd.read_excel(
                uploaded_file,
                sheet_name="Input"
            )

            # -----------------------------------------
            # REMOVE EMPTY ROWS & COLUMNS
            # -----------------------------------------

            df = df.dropna(
                how="all"
            )

            df = df.dropna(
                axis=1,
                how="all"
            )

            # -----------------------------------------
            # REPLACE NaN
            # -----------------------------------------

            df = df.fillna("")

            # -----------------------------------------
            # PREVIEW
            # -----------------------------------------

            st.subheader("Preview")

            st.dataframe(
                df.head(20),
                use_container_width=True
            )

            st.info(
                f"Total Clean Records Found: {len(df)}"
            )

            # -----------------------------------------
            # IMPORT BUTTON
            # -----------------------------------------

            if st.button("Import All Records"):

                success = 0
                duplicate = 0
                failed = 0

                for _, row in df.iterrows():

                    try:

                        # ---------------------------------
                        # MOBILE CLEANUP
                        # ---------------------------------

                        mobile_raw = row.get(
                            "Mobile",
                            ""
                        )

                        if mobile_raw == "":

                            failed += 1

                            continue

                        mobile = str(
                            int(float(mobile_raw))
                        ).strip()

                        # ---------------------------------
                        # BATCH CLEANUP
                        # ---------------------------------

                        batch_raw = row.get(
                            "Year",
                            ""
                        )

                        batch_year = ""

                        if batch_raw != "":

                            batch_year = str(
                                int(float(batch_raw))
                            )

                        # ---------------------------------
                        # DEPARTMENT SHORT NAME
                        # ---------------------------------

                        department = get_department_short_name(
                            row.get("Stream", "")
                        )

                        # ---------------------------------
                        # FAMILY MEMBERS
                        # ---------------------------------

                        family_members = 0

                        family_raw = row.get(
                            "Number of Accompanying Family Members",
                            0
                        )

                        if family_raw != "":

                            try:

                                family_members = int(
                                    float(family_raw)
                                )

                            except:

                                family_members = 0

                        # ---------------------------------
                        # ATTENDEE OBJECT
                        # ---------------------------------

                        attendee = {

                            "name": str(
                                row.get("Name", "")
                            ).strip(),

                            "course": str(
                                row.get("Course", "")
                            ).strip(),

                            "stream": department,

                            "batch_year": batch_year,

                            "email": str(
                                row.get("Email", "")
                            ).strip(),

                            "mobile": mobile,

                            "city": "",

                            "company": "",

                            "status": str(
                                row.get("Status", "")
                            ).strip(),

                            "food_preference": str(
                                row.get(
                                    "Your Food Preference?",
                                    ""
                                )
                            ).strip(),

                            "family_members": family_members,

                            "gender": str(
                                row.get("Gender", "")
                            ).strip(),

                            "branch": str(
                                row.get("Branch", "")
                            ).strip(),

                            "proper_name": str(
                                row.get("Proper Name", "")
                            ).strip(),

                            "registration_type": "Pre-Registered",

                            "payment_status": "Paid",

                            "payment_mode": "Online",

                            "amount_paid": 0,

                            "remarks": ""

                        }

                        # ---------------------------------
                        # INSERT TO DATABASE
                        # ---------------------------------

                        result = db.insert_attendee(
                            attendee
                        )

                        if result:

                            success += 1

                        else:

                            duplicate += 1

                    except Exception:

                        failed += 1

                # -----------------------------------------
                # SUMMARY
                # -----------------------------------------

                st.success(
                    f"Successfully Imported: {success}"
                )

                st.warning(
                    f"Duplicates Skipped: {duplicate}"
                )

                st.error(
                    f"Failed Records: {failed}"
                )

        except Exception as e:

            st.error(
                f"Import Failed: {e}"
            )