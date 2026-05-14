import streamlit as st
import pandas as pd


def render_import_page(db):

    st.title("Import Pre-Registered Alumni")

    uploaded_file = st.file_uploader(
        "Upload Excel File",
        type=["xlsx"]
    )

    if uploaded_file:

        try:

            df = pd.read_excel(
                uploaded_file,
                sheet_name="Input"
            )

            st.subheader("Preview")

            st.dataframe(
                df.head(20),
                use_container_width=True
            )

            st.info(
                f"Total Records Found: {len(df)}"
            )

            if st.button("Import All Records"):

                success = 0
                duplicate = 0
                failed = 0

                for _, row in df.iterrows():

                    mobile = str(
                        row.get("Mobile", "")
                    ).strip()

                    if mobile == "" or mobile == "nan":
                        failed += 1
                        continue

                    attendee = {

                        "name": str(
                            row.get("Name", "")
                        ),

                        "course": str(
                            row.get("Course", "")
                        ),

                        "stream": str(
                            row.get("Stream", "")
                        ),

                        "batch_year": str(
                            row.get("Year", "")
                        ),

                        "email": str(
                            row.get("Email", "")
                        ),

                        "mobile": mobile,

                        "city": "",

                        "company": "",

                        "status": str(
                            row.get("Status", "")
                        ),

                        "food_preference": str(
                            row.get(
                                "Your Food Preference?",
                                ""
                            )
                        ),

                        "family_members": int(
                            row.get(
                                "Number of Accompanying Family Members",
                                0
                            )
                        ) if pd.notna(
                            row.get(
                                "Number of Accompanying Family Members",
                                0
                            )
                        ) else 0,

                        "gender": str(
                            row.get("Gender", "")
                        ),

                        "branch": str(
                            row.get("Branch", "")
                        ),

                        "proper_name": str(
                            row.get("Proper Name", "")
                        ),

                        "registration_type": "Pre-Registered",

                        "payment_status": "Paid",

                        "payment_mode": "Online",

                        "amount_paid": 0,

                        "remarks": ""

                    }

                    result = db.insert_attendee(
                        attendee
                    )

                    if result:
                        success += 1
                    else:
                        duplicate += 1

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