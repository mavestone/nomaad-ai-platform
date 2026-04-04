import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# We want to extract the content inside <main> ... </main> and put it into a new component named BusinessOverview.
# The <main> starts around line 372 and ends around 505.
main_pattern = re.compile(r'(<main[^>]*>)(.*?)(</main>)', re.DOTALL)
match = main_pattern.search(content)

if match:
    main_start_tag = match.group(1)
    main_inner = match.group(2)
    main_end_tag = match.group(3)
    
    # We will define BusinessOverview before `export default function Dashboard(){`
    # Also we need to import CRMView at the top.
    
    business_overview_comp = """
function BusinessOverview({ t, dark, mobile, compact, mode, notifOpen, setNotifOpen, w }) {
  const ease="all 0.45s cubic-bezier(.4,0,.2,1)";
  const card=(ex={})=>({background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:20,boxShadow:t.cardShadow,transition:ease,backdropFilter:"blur(24px) saturate(1.6)",...ex});

  return (
    <>
""" + main_inner + """
    </>
  );
}
"""

    # Change the content of App.jsx
    new_content = content.replace('export default function Dashboard(){', business_overview_comp + '\nexport default function Dashboard(){')
    
    # Add import
    new_content = new_content.replace('import AreaChartDemo from "./components/ui/demo";', 'import AreaChartDemo from "./components/ui/demo";\nimport CRMView from "./components/ui/crm-view";')
    
    # Change nav array label "Customers" -> "CRM"
    new_content = new_content.replace('label:"Customers"}', 'label:"CRM"}')
    
    # Replace the inside of main
    new_main_inner = """
        {nav === 0 && <BusinessOverview t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} notifOpen={notifOpen} setNotifOpen={setNotifOpen} w={w} />}
        {nav === 3 && <CRMView t={t} dark={dark} mobile={mobile} compact={compact} mode={mode} notifOpen={notifOpen} setNotifOpen={setNotifOpen} w={w} IC={IC} pal={pal} VOLT={VOLT} VOLTD={VOLTD} />}
"""
    new_content = new_content.replace(match.group(0), main_start_tag + new_main_inner + main_end_tag)
    
    with open('src/App.jsx', 'w') as f:
        f.write(new_content)
    print("Refactored App.jsx")
else:
    print("Could not find <main> pattern")
