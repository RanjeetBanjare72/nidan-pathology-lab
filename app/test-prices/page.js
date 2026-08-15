"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/*
=========================================================
 NIDAN PATHOLOGY LAB
 TEST PRICE MANAGEMENT

 FILE:
 app/test-prices/page.js

 FEATURES:
 ✓ Load all tests from test_prices
 ✓ Search tests
 ✓ Add new test
 ✓ Edit price
 ✓ Save price
 ✓ Activate / deactivate test
 ✓ Delete test
 ✓ Mobile responsive
 ✓ Dashboard button
 ✓ Back to Reports
 ✓ Supabase connected
=========================================================
*/

export default function TestPricesPage() {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);

  const [newTest, setNewTest] = useState({
    test_id: "",
    test_name: "",
    category: "PATHOLOGY",
    price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     LOAD TESTS
  ===================================================== */

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("test_prices")
        .select("*")
        .order("test_name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setTests(data || []);
    } catch (error) {
      console.error("LOAD TEST PRICES ERROR:", error);

      setErrorMessage(
        error?.message ||
          "Test prices load nahi ho paye."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredTests = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) {
      return tests;
    }

    return tests.filter((test) => {
      return (
        String(test.test_name || "")
          .toLowerCase()
          .includes(value) ||
        String(test.test_id || "")
          .toLowerCase()
          .includes(value) ||
        String(test.category || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [tests, search]);

  /* =====================================================
     ADD TEST
  ===================================================== */

  async function addTest(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setMessage("");

      const testName =
        newTest.test_name.trim();

      if (!testName) {
        throw new Error(
          "Test Name enter karein."
        );
      }

      const priceNumber =
        Number(newTest.price);

      if (
        newTest.price === "" ||
        Number.isNaN(priceNumber) ||
        priceNumber < 0
      ) {
        throw new Error(
          "Valid test price enter karein."
        );
      }

      const testId =
        newTest.test_id.trim() ||
        `TEST-${Date.now()}`;

      const { data, error } =
        await supabase
          .from("test_prices")
          .insert([
            {
              test_id: testId,
              test_name: testName,
              category:
                newTest.category.trim() ||
                "PATHOLOGY",
              price: priceNumber,
              is_active: true,
            },
          ])
          .select()
          .single();

      if (error) {
        throw error;
      }

      setTests((previous) => [
        ...previous,
        data,
      ]);

      setNewTest({
        test_id: "",
        test_name: "",
        category: "PATHOLOGY",
        price: "",
      });

      setShowAddForm(false);

      setMessage(
        "New test successfully add ho gaya."
      );
    } catch (error) {
      console.error(
        "ADD TEST ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Test add nahi hua."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     START EDIT
  ===================================================== */

  function startEdit(test) {
    setEditingId(test.id);

    setEditPrice(
      test.price ?? ""
    );

    setMessage("");
    setErrorMessage("");
  }

  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  function cancelEdit() {
    setEditingId(null);
    setEditPrice("");
  }

  /* =====================================================
     SAVE PRICE
  ===================================================== */

  async function savePrice(test) {
    try {
      setSaving(true);
      setErrorMessage("");
      setMessage("");

      const priceNumber =
        Number(editPrice);

      if (
        editPrice === "" ||
        Number.isNaN(priceNumber) ||
        priceNumber < 0
      ) {
        throw new Error(
          "Valid price enter karein."
        );
      }

      const { data, error } =
        await supabase
          .from("test_prices")
          .update({
            price: priceNumber,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", test.id)
          .select()
          .single();

      if (error) {
        throw error;
      }

      setTests((previous) =>
        previous.map((item) =>
          item.id === test.id
            ? data
            : item
        )
      );

      setEditingId(null);
      setEditPrice("");

      setMessage(
        `${test.test_name} ka price successfully update ho gaya.`
      );
    } catch (error) {
      console.error(
        "SAVE PRICE ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Price update nahi hua."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     TOGGLE ACTIVE
  ===================================================== */

  async function toggleActive(test) {
    try {
      setSaving(true);
      setErrorMessage("");
      setMessage("");

      const { data, error } =
        await supabase
          .from("test_prices")
          .update({
            is_active:
              !test.is_active,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", test.id)
          .select()
          .single();

      if (error) {
        throw error;
      }

      setTests((previous) =>
        previous.map((item) =>
          item.id === test.id
            ? data
            : item
        )
      );

      setMessage(
        `${test.test_name} ${
          data.is_active
            ? "activate"
            : "deactivate"
        } ho gaya.`
      );
    } catch (error) {
      console.error(
        "TOGGLE TEST ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Test status update nahi hua."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE TEST
  ===================================================== */

  async function deleteTest(test) {
    const confirmed =
      window.confirm(
        `Kya aap "${test.test_name}" ko delete karna chahte hain?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setMessage("");

      const { error } =
        await supabase
          .from("test_prices")
          .delete()
          .eq("id", test.id);

      if (error) {
        throw error;
      }

      setTests((previous) =>
        previous.filter(
          (item) =>
            item.id !== test.id
        )
      );

      setMessage(
        `${test.test_name} delete ho gaya.`
      );
    } catch (error) {
      console.error(
        "DELETE TEST ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Test delete nahi hua."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  function goDashboard() {
    router.push("/");
  }

  /* =====================================================
     REPORTS
  ===================================================== */

  function goReports() {
    router.push("/reports");
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="pricePage">
        <div className="loadingCard">
          <div className="loadingIcon">
            ₹
          </div>

          <h2>
            Test Prices Loading...
          </h2>

          <p>
            NIDAN PATHOLOGY LAB
          </p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="pricePage">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="topHeader">

        <div className="brand">

          <div className="brandLogo">
            N
          </div>

          <div>
            <h1>
              NIDAN PATHOLOGY LAB
            </h1>

            <p>
              Test Price Management
            </p>
          </div>

        </div>


        <div className="topActions">

          <button
            onClick={goDashboard}
            className="dashboardButton"
          >
            🏠 Dashboard
          </button>

          <button
            onClick={goReports}
            className="reportsButton"
          >
            📋 Reports
          </button>

        </div>

      </header>


      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div className="successMessage">
          ✅ {message}
        </div>
      )}


      {errorMessage && (
        <div className="errorMessage">
          ❌ {errorMessage}
        </div>
      )}


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section className="mainCard">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="toolbar">

          <div>

            <h2>
              💰 Test Price List
            </h2>

            <span>
              Total Tests:{" "}
              <strong>
                {tests.length}
              </strong>
            </span>

          </div>


          <div className="toolbarActions">

            <div className="searchBox">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search test..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <button
              onClick={() =>
                setShowAddForm(
                  !showAddForm
                )
              }
              className="addButton"
            >
              {showAddForm
                ? "✕ Close"
                : "＋ Add Test"}
            </button>

          </div>

        </div>


        {/* =================================================
            ADD TEST FORM
        ================================================= */}

        {showAddForm && (

          <form
            onSubmit={addTest}
            className="addForm"
          >

            <div className="formTitle">
              ➕ Add New Laboratory Test
            </div>


            <div className="formGrid">

              <label>
                Test ID
                <input
                  type="text"
                  placeholder="Example: CBC"
                  value={
                    newTest.test_id
                  }
                  onChange={(event) =>
                    setNewTest(
                      (previous) => ({
                        ...previous,
                        test_id:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <label>
                Test Name *
                <input
                  type="text"
                  placeholder="Example: Complete Blood Count"
                  value={
                    newTest.test_name
                  }
                  onChange={(event) =>
                    setNewTest(
                      (previous) => ({
                        ...previous,
                        test_name:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <label>
                Category
                <input
                  type="text"
                  placeholder="PATHOLOGY"
                  value={
                    newTest.category
                  }
                  onChange={(event) =>
                    setNewTest(
                      (previous) => ({
                        ...previous,
                        category:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <label>
                Price ₹ *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={
                    newTest.price
                  }
                  onChange={(event) =>
                    setNewTest(
                      (previous) => ({
                        ...previous,
                        price:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

            </div>


            <div className="formButtons">

              <button
                type="button"
                onClick={() =>
                  setShowAddForm(false)
                }
                className="cancelButton"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={saving}
                className="saveNewButton"
              >
                {saving
                  ? "Saving..."
                  : "💾 Save Test"}
              </button>

            </div>

          </form>

        )}


        {/* =================================================
            TABLE
        ================================================= */}

        {filteredTests.length === 0 ? (

          <div className="emptyState">

            <div>
              🔎
            </div>

            <h3>
              No Tests Found
            </h3>

            <p>
              {tests.length === 0
                ? "Abhi koi test price list me nahi hai."
                : "Search ke according koi test nahi mila."}
            </p>

            {tests.length === 0 && (
              <button
                onClick={() =>
                  setShowAddForm(true)
                }
                className="addButton"
              >
                ＋ Add First Test
              </button>
            )}

          </div>

        ) : (

          <div className="tableWrapper">

            <table className="priceTable">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    TEST NAME
                  </th>

                  <th>
                    TEST ID
                  </th>

                  <th>
                    CATEGORY
                  </th>

                  <th>
                    CURRENT PRICE
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredTests.map(
                  (test, index) => {

                    const isEditing =
                      editingId ===
                      test.id;

                    return (

                      <tr
                        key={
                          test.id
                        }
                      >

                        <td>
                          {index + 1}
                        </td>


                        <td className="testName">
                          <strong>
                            {
                              test.test_name
                            }
                          </strong>
                        </td>


                        <td>
                          <span className="testId">
                            {
                              test.test_id ||
                              "-"
                            }
                          </span>
                        </td>


                        <td>
                          <span className="category">
                            {
                              test.category ||
                              "PATHOLOGY"
                            }
                          </span>
                        </td>


                        <td>

                          {isEditing ? (

                            <div className="priceEdit">

                              <span>
                                ₹
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  editPrice
                                }
                                autoFocus
                                onChange={(
                                  event
                                ) =>
                                  setEditPrice(
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />

                            </div>

                          ) : (

                            <span className="price">
                              ₹
                              {Number(
                                test.price ||
                                  0
                              ).toFixed(2)}
                            </span>

                          )}

                        </td>


                        <td>

                          {test.is_active ? (

                            <span className="active">
                              ● Active
                            </span>

                          ) : (

                            <span className="inactive">
                              ● Inactive
                            </span>

                          )}

                        </td>


                        <td>

                          <div className="rowActions">

                            {isEditing ? (

                              <>
                                <button
                                  onClick={() =>
                                    savePrice(
                                      test
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="saveButton"
                                >
                                  💾 Save
                                </button>

                                <button
                                  onClick={
                                    cancelEdit
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="smallCancel"
                                >
                                  Cancel
                                </button>
                              </>

                            ) : (

                              <>

                                <button
                                  onClick={() =>
                                    startEdit(
                                      test
                                    )
                                  }
                                  className="editButton"
                                >
                                  ✏️ Edit
                                </button>


                                <button
                                  onClick={() =>
                                    toggleActive(
                                      test
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className={
                                    test.is_active
                                      ? "deactivateButton"
                                      : "activateButton"
                                  }
                                >
                                  {test.is_active
                                    ? "Disable"
                                    : "Enable"}
                                </button>


                                <button
                                  onClick={() =>
                                    deleteTest(
                                      test
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="deleteButton"
                                >
                                  🗑
                                </button>

                              </>

                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer">

        <strong>
          NIDAN PATHOLOGY LAB
        </strong>

        <span>
          Clinical Pathology & Diagnostic Laboratory
        </span>

        <small>
          Test Price Management System
        </small>

      </footer>


      <style jsx>{styles}</style>

    </main>
  );
}


/* =========================================================
   CSS
========================================================= */

const styles = `

* {
  box-sizing: border-box;
}

.pricePage {
  min-height: 100vh;
  padding: 15px;
  background:
    linear-gradient(
      180deg,
      #eef4f7,
      #e6eef2
    );
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  color: #263238;
}


/* =====================================================
   HEADER
===================================================== */

.topHeader {
  max-width: 1200px;
  margin: 0 auto 12px;
  padding: 12px 15px;
  background: #ffffff;
  border-radius: 9px;
  box-shadow:
    0 2px 10px
    rgba(0,0,0,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brandLogo {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(
      135deg,
      #087f78,
      #0b6875
    );
  color: white;
  font-size: 22px;
  font-weight: 900;
}

.brand h1 {
  margin: 0;
  font-size: 19px;
  color: #172033;
}

.brand p {
  margin: 3px 0 0;
  color: #087f78;
  font-size: 11px;
  font-weight: 700;
}

.topActions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.dashboardButton,
.reportsButton {
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

.dashboardButton {
  border: 1px solid #087f78;
  color: #087f78;
  background: #effaf8;
}

.reportsButton {
  border: 1px solid #c5d0d5;
  color: #344054;
  background: white;
}


/* =====================================================
   MESSAGE
===================================================== */

.successMessage,
.errorMessage {
  max-width: 1200px;
  margin: 0 auto 10px;
  padding: 10px 13px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
}

.successMessage {
  background: #e9f8f1;
  border: 1px solid #a9ddc3;
  color: #176b46;
}

.errorMessage {
  background: #fff0f0;
  border: 1px solid #efb7b7;
  color: #a32626;
}


/* =====================================================
   MAIN CARD
===================================================== */

.mainCard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
  background: white;
  border-radius: 9px;
  box-shadow:
    0 2px 10px
    rgba(0,0,0,.07);
}


/* =====================================================
   TOOLBAR
===================================================== */

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
  flex-wrap: wrap;
}

.toolbar h2 {
  margin: 0;
  color: #147c75;
  font-size: 17px;
}

.toolbar span {
  color: #667085;
  font-size: 11px;
}

.toolbarActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.searchBox {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cfd8dc;
  border-radius: 6px;
  background: white;
}

.searchBox input {
  width: 210px;
  border: none;
  outline: none;
  font-size: 13px;
}

.addButton {
  border: none;
  border-radius: 6px;
  padding: 9px 13px;
  background: #087f78;
  color: white;
  font-weight: 800;
  cursor: pointer;
}


/* =====================================================
   ADD FORM
===================================================== */

.addForm {
  margin-bottom: 15px;
  padding: 14px;
  border: 1px solid #b9ddd8;
  border-radius: 7px;
  background: #f5fbfa;
}

.formTitle {
  margin-bottom: 12px;
  color: #087f78;
  font-size: 14px;
  font-weight: 800;
}

.formGrid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 10px;
}

.formGrid label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #52606a;
}

.formGrid input {
  width: 100%;
  min-height: 38px;
  border: 1px solid #cbd7dc;
  border-radius: 5px;
  padding: 8px 9px;
  outline: none;
  background: white;
  font-size: 13px;
}

.formButtons {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 12px;
}

.cancelButton {
  padding: 8px 13px;
  border: 1px solid #c5d0d5;
  border-radius: 5px;
  background: white;
  cursor: pointer;
}

.saveNewButton {
  padding: 8px 13px;
  border: none;
  border-radius: 5px;
  background: #087f78;
  color: white;
  font-weight: 700;
  cursor: pointer;
}


/* =====================================================
   TABLE
===================================================== */

.tableWrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #d7e0e4;
  border-radius: 7px;
}

.priceTable {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.priceTable th {
  padding: 10px 8px;
  background:
    linear-gradient(
      180deg,
      #edf5f6,
      #e2edef
    );
  border: 1px solid #d2dce1;
  color: #344054;
  font-size: 10px;
  text-align: left;
  white-space: nowrap;
}

.priceTable td {
  padding: 9px 8px;
  border: 1px solid #e0e6e9;
  font-size: 12px;
  vertical-align: middle;
}

.priceTable tbody tr:nth-child(even) {
  background: #fbfcfd;
}

.priceTable tbody tr:hover {
  background: #f4faf9;
}

.testName {
  min-width: 220px;
}

.testId {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 3px;
  background: #f1f4f6;
  color: #52606a;
  font-size: 10px;
  font-weight: 700;
}

.category {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 3px;
  background: #e8f7f4;
  color: #087f78;
  font-size: 9px;
  font-weight: 800;
}

.price {
  color: #087f78;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
}

.priceEdit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.priceEdit span {
  color: #087f78;
  font-weight: 800;
}

.priceEdit input {
  width: 100px;
  height: 34px;
  border: 1px solid #087f78;
  border-radius: 5px;
  padding: 5px 7px;
  outline: none;
  font-weight: 700;
}


/* =====================================================
   STATUS
===================================================== */

.active {
  color: #16834b;
  font-weight: 800;
  font-size: 11px;
}

.inactive {
  color: #a32626;
  font-weight: 800;
  font-size: 11px;
}


/* =====================================================
   ACTIONS
===================================================== */

.rowActions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.editButton,
.saveButton,
.smallCancel,
.deactivateButton,
.activateButton,
.deleteButton {
  border-radius: 5px;
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.editButton {
  border: 1px solid #d9bd63;
  background: #fffdf2;
  color: #806000;
}

.saveButton {
  border: none;
  background: #087f78;
  color: white;
}

.smallCancel {
  border: 1px solid #c5d0d5;
  background: white;
  color: #344054;
}

.deactivateButton {
  border: 1px solid #efb7b7;
  background: #fff1f1;
  color: #a32626;
}

.activateButton {
  border: 1px solid #a9ddc3;
  background: #effaf4;
  color: #176b46;
}

.deleteButton {
  border: 1px solid #efb7b7;
  background: #fff5f5;
  color: #b42318;
}


/* =====================================================
   EMPTY
===================================================== */

.emptyState {
  padding: 45px 20px;
  text-align: center;
  border: 1px dashed #cbd7dc;
  border-radius: 7px;
  background: #fafcfd;
}

.emptyState > div {
  font-size: 30px;
}

.emptyState h3 {
  margin: 8px 0 4px;
  color: #344054;
}

.emptyState p {
  margin: 0 0 15px;
  color: #667085;
  font-size: 12px;
}


/* =====================================================
   LOADING
===================================================== */

.loadingCard {
  max-width: 420px;
  margin: 100px auto;
  padding: 35px;
  background: white;
  border-radius: 10px;
  text-align: center;
  box-shadow:
    0 5px 20px
    rgba(0,0,0,.08);
}

.loadingIcon {
  width: 60px;
  height: 60px;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #087f78;
  color: white;
  font-size: 25px;
  font-weight: 900;
}

.loadingCard h2 {
  margin: 0 0 6px;
}

.loadingCard p {
  margin: 0;
  color: #667085;
}


/* =====================================================
   FOOTER
===================================================== */

.footer {
  max-width: 1200px;
  margin: 15px auto 0;
  padding: 15px;
  text-align: center;
  color: #667085;
}

.footer strong {
  display: block;
  color: #087f78;
  font-size: 12px;
}

.footer span {
  display: block;
  margin-top: 3px;
  font-size: 10px;
}

.footer small {
  display: block;
  margin-top: 3px;
  font-size: 9px;
}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 700px) {

  .pricePage {
    padding: 7px;
  }

  .topHeader {
    padding: 10px;
  }

  .brandLogo {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }

  .brand h1 {
    font-size: 14px;
  }

  .brand p {
    font-size: 9px;
  }

  .topActions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .dashboardButton,
  .reportsButton {
    width: 100%;
    font-size: 11px;
  }

  .mainCard {
    padding: 9px;
  }

  .toolbar {
    align-items: stretch;
  }

  .toolbarActions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
  }

  .searchBox {
    width: 100%;
  }

  .searchBox input {
    width: 100%;
  }

  .addButton {
    white-space: nowrap;
  }

  .formGrid {
    grid-template-columns:
      1fr;
  }

  .formButtons {
    justify-content: stretch;
  }

  .formButtons button {
    flex: 1;
  }

  .priceTable {
    min-width: 850px;
  }

  .footer {
    padding-bottom: 25px;
  }
}

`;
