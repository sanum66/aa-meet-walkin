import streamlit as st
import pandas as pd


def render_export_page(db):

    st.title("Export Attendee Data")

    attendees = db.get_all_attendees()

    if attendees:

        columns = [
            "id",
            "attendee_id",
            "name",
            "course",
            "stream",
            "batch_year",
            "email",
            "mobile",
            "city",
            "company",
            "status",
            "food_preference",
            "family_members",
            "gender",
            "branch",
            "proper_name",
            "registration_type",
            "payment_status",
            "payment_mode",
            "amount_paid",
            "remarks",
            "checked_in",
            "created_at"
        ]

        df = pd.DataFrame(
            attendees,
            columns=columns
        )

        st.subheader("Attendee Records")

        st.dataframe(
            df,
            use_container_width=True
        )

        # ---------------------------------------
        # CSV EXPORT
        # ---------------------------------------

        csv = df.to_csv(
            index=False
        ).encode("utf-8")

        st.download_button(
            label="Download CSV",
            data=csv,
            file_name="attendees_export.csv",
            mime="text/csv"
        )

        # ---------------------------------------
        # EXCEL EXPORT
        # ---------------------------------------

        excel_file = "attendees_export.xlsx"

        df.to_excel(
            excel_file,
            index=False
        )

        with open(excel_file, "rb") as f:

            st.download_button(
                label="Download Excel",
                data=f,
                file_name="attendees_export.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )

    else:

        st.info(
            "No attendee data available."
        )