import streamlit as st
import pandas as pd
import altair as alt

from utils import dataframe_from_records


def render_analytics_page(db):
    st.header("Analytics")
    st.write("Interactive charts and event trends to help volunteers track participation in real time.")

    batch_data = dataframe_from_records(db.analytics_by_batch())
    dept_data = dataframe_from_records(db.analytics_by_department())
    daily_data = dataframe_from_records(db.analytics_by_date())

    if not batch_data.empty:
        st.subheader("Batch Trend")
        batch_chart = alt.Chart(batch_data).mark_line(point=True).encode(
            x=alt.X("category:N", title="Batch Year"),
            y=alt.Y("count:Q", title="Registrations"),
            tooltip=["category", "count"],
            color=alt.value("#1f77b4"),
        )
        st.altair_chart(batch_chart, use_container_width=True)
    else:
        st.info("Batch trend is available after registrations start.")

    if not dept_data.empty:
        st.subheader("Department Distribution")
        dept_chart = alt.Chart(dept_data).mark_arc(innerRadius=50).encode(
            theta=alt.Theta(field="count", type="quantitative"),
            color=alt.Color(field="category", type="nominal", legend=alt.Legend(title="Department")),
            tooltip=["category", "count"],
        )
        st.altair_chart(dept_chart, use_container_width=True)
    else:
        st.info("Department analytics will be visible once attendees are added.")

    if not daily_data.empty:
        st.subheader("Daily Registration Trend")
        daily_data["day"] = pd.to_datetime(daily_data["day"])
        trends_chart = alt.Chart(daily_data).mark_bar(cornerRadiusTopLeft=5, cornerRadiusTopRight=5).encode(
            x=alt.X("day:T", title="Date"),
            y=alt.Y("count:Q", title="New Registrations"),
            tooltip=["day", "count"],
            color=alt.value("#ff7f0e"),
        )
        st.altair_chart(trends_chart, use_container_width=True)
    else:
        st.info("Daily registration trend updates after new check-ins and registrations.")
