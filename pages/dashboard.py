import streamlit as st
import pandas as pd
import altair as alt

from utils import dataframe_from_records


def render_dashboard_page(db):

    st.header("Dashboard")

    metrics = db.get_metrics()

    col1, col2, col3, col4, col5, col6 = st.columns(6)

    col1.metric("📊 Total Registrations", metrics["total"])
    col2.metric("🚶 Walk-Ins", metrics["walk_in"])
    col3.metric("✅ Checked-In", metrics["checked_in"])
    col4.metric("💳 Membership", f"₹{metrics['membership_total']:.2f}")
    col5.metric("🎁 Contribution", f"₹{metrics['contribution_total']:.2f}")
    col6.metric("💰 Total Collected", f"₹{metrics['paid']:.2f}")

    st.markdown("---")

    batch_data = dataframe_from_records(
        db.analytics_by_batch()
    )

    dept_data = dataframe_from_records(
        db.analytics_by_department()
    )

    daily_data = dataframe_from_records(
        db.analytics_by_date()
    )

    row1, row2 = st.columns(2)

    with row1:

        st.subheader("Batch Participation")

        if not batch_data.empty:

            chart = alt.Chart(batch_data).mark_bar().encode(
                x=alt.X(
                    "category:N",
                    title="Batch Year",
                    sort="-y"
                ),
                y=alt.Y(
                    "count:Q",
                    title="Attendee Count"
                ),
                tooltip=["category", "count"]
            )

            st.altair_chart(
                chart,
                use_container_width=True
            )

        else:
            st.info("No data available")

    with row2:

        st.subheader("Department Analytics")

        if not dept_data.empty:

            chart = alt.Chart(dept_data).mark_bar().encode(
                x=alt.X(
                    "count:Q",
                    title="Attendees"
                ),
                y=alt.Y(
                    "category:N",
                    title="Department",
                    sort="-x"
                ),
                tooltip=["category", "count"]
            )

            st.altair_chart(
                chart,
                use_container_width=True
            )

        else:
            st.info("No data available")

    st.markdown("---")

    st.subheader("Daily Registration Trends")

    if not daily_data.empty:

        daily_data["day"] = pd.to_datetime(
            daily_data["day"]
        )

        chart = alt.Chart(daily_data).mark_line(
            point=True
        ).encode(
            x=alt.X(
                "day:T",
                title="Date"
            ),
            y=alt.Y(
                "count:Q",
                title="Registrations"
            ),
            tooltip=["day", "count"]
        )

        st.altair_chart(
            chart,
            use_container_width=True
        )

    else:
        st.info("No registration trends yet")

    st.markdown("---")

    st.write(
        "Use the sidebar to manage registrations and check-ins."
    )