import streamlit as st
import pandas as pd

from database import Database
from utils import dataframe_from_records, export_to_csv, export_to_excel


def render_admin_panel(db: Database):
    st.header("Admin Panel")
    st.write("Manage attendees, apply filters, and export registration data for chapter meets.")

    filters = {
        "batch_year": st.selectbox("Filter by Batch", ["All"] + [str(x[0]) for x in db.analytics_by_batch()]),
        "department": st.selectbox("Filter by Department", ["All"] + [x[0] for x in db.analytics_by_department()]),
        "payment_status": st.selectbox("Filter by Payment Status", ["All", "Paid", "Pending", "Waived"]),
        "checked_in": st.selectbox("Filter by Check-In Status", ["All", 1, 0]),
    }
    if filters["checked_in"] == 1:
        filters["checked_in"] = 1
    elif filters["checked_in"] == 0:
        filters["checked_in"] = 0
    else:
        filters.pop("checked_in")

    attendees = db.list_attendees(filters)
    df = dataframe_from_records(attendees)

    st.markdown(f"**Total records:** {len(attendees)}")
    if not df.empty:
        st.dataframe(df.drop(columns=["qr_code_path"]) if "qr_code_path" in df.columns else df, use_container_width=True)

        download_cols = df.drop(columns=["qr_code_path"]) if "qr_code_path" in df.columns else df
        col1, col2 = st.columns(2)
        with col1:
            st.download_button("Download CSV", export_to_csv(download_cols), file_name="attendees.csv", mime="text/csv")
        with col2:
            st.download_button("Download Excel", export_to_excel(download_cols), file_name="attendees.xlsx")

        attendee_id = st.text_input("Enter Attendee ID to edit or delete")
        if attendee_id:
            attendee = db.get_attendee(attendee_id=attendee_id.strip())
            if attendee:
                st.subheader("Edit Attendee Details")
                with st.form(key="edit_attendee_form"):
                    full_name = st.text_input("Full Name", value=attendee["full_name"])
                    batch_year = st.text_input("Batch Year", value=attendee["batch_year"])
                    department = st.text_input("Department", value=attendee["department"])
                    mobile = st.text_input("Mobile Number", value=attendee["mobile"])
                    email = st.text_input("Email ID", value=attendee["email"])
                    city = st.text_input("City", value=attendee["city"])
                    company = st.text_input("Company / Profession", value=attendee["company"])
                    payment_status = st.selectbox("Payment Status", ["Paid", "Pending", "Waived"], index=["Paid", "Pending", "Waived"].index(attendee["payment_status"]))
                    payment_mode = st.text_input("Payment Mode", value=attendee["payment_mode"])
                    amount_paid = st.text_input("Amount Paid", value=str(attendee["amount_paid"]))
                    food_preference = st.text_input("Food Preference", value=attendee["food_preference"])
                    remarks = st.text_area("Remarks", value=attendee["remarks"])
                    submit_edit = st.form_submit_button("Save Changes")
                if submit_edit:
                    db.update_attendee(
                        attendee_id,
                        full_name=full_name.strip().title(),
                        batch_year=batch_year.strip(),
                        department=department.strip().title(),
                        mobile=mobile.strip(),
                        email=email.strip(),
                        city=city.strip().title(),
                        company=company.strip().title(),
                        payment_status=payment_status,
                        payment_mode=payment_mode.strip(),
                        amount_paid=float(amount_paid or 0),
                        food_preference=food_preference.strip(),
                        remarks=remarks.strip(),
                    )
                    st.success("Attendee record updated successfully.")
                    st.experimental_rerun()
                if st.button("Delete This Record"):
                    db.delete_attendee(attendee_id)
                    st.warning("Attendee record deleted.")
                    st.experimental_rerun()
            else:
                st.info("Attendee ID not found.")
    else:
        st.info("No attendees match the selected filter criteria.")
