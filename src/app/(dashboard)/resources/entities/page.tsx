'use client';

import { ExternalLink, Scale } from 'lucide-react';
import Header from '@/components/layout/header';

const LINKS = [
  { name: 'Alabama Business Entity', url: 'https://www.sos.alabama.gov/government-records/business-entity-records' },
  { name: 'Alaska Corporations Database', url: 'https://www.commerce.alaska.gov/cbp/main/search/entities' },
  { name: 'Arizona eCorp Business Entity Search', url: 'https://ecorp.azcc.gov/EntitySearch/Index' },
  { name: 'Arkansas Business Entity Search', url: 'https://www.ark.org/corp-search/index.php' },
  { name: 'California Business Search', url: 'https://bizfileonline.sos.ca.gov/search/business' },
  { name: 'Colorado Business Database Search', url: 'https://www.sos.state.co.us/biz/BusinessEntityCriteriaExt.do?resetTransTyp=Y' },
  { name: 'Connecticut Business Inquiry Search', url: 'https://service.ct.gov/business/s/onlinebusinesssearch' },
  { name: 'Delaware Business Entity Search', url: 'https://icis.corp.delaware.gov/Ecorp/EntitySearch/NameSearch.aspx' },
  { name: 'District of Columbia Business Filings Search', url: 'https://corponline.dcra.dc.gov/Home.aspx', note: 'login required' },
  { name: 'Florida Business Name Search', url: 'http://search.sunbiz.org/Inquiry/CorporationSearch/ByName' },
  { name: 'Georgia Business Search', url: 'https://ecorp.sos.ga.gov/BusinessSearch' },
  { name: 'Hawaii Business Entity & Documents Search', url: 'https://hbe.ehawaii.gov/documents/search.html' },
  { name: 'Idaho Business Entity Search', url: 'https://sosbiz.idaho.gov/search/business' },
  { name: 'Illinois Corporation & LLC Search', url: 'https://apps.ilsos.gov/corporatellc/' },
  { name: 'Indiana Business Search', url: 'https://bsd.sos.in.gov/publicbusinesssearch' },
  { name: 'Iowa Business Entities Search', url: 'https://sos.iowa.gov/search/business/search.aspx' },
  { name: 'Kansas Business Entity Search Station (BESS)', url: 'https://www.kansas.gov/bess/flow/main?execution=e1s1' },
  { name: 'Kentucky Business Entity Search', url: 'https://sosbes.sos.ky.gov/BusSearchNProfile/Search.aspx' },
  { name: 'Louisiana Business Filings Search', url: 'https://coraweb.sos.la.gov/CommercialSearch/CommercialSearch.aspx' },
  { name: 'Maine Corporate Name Search', url: 'https://icrs.informe.org/nei-sos-icrs/ICRS?MainPage=x' },
  { name: 'Maryland Business Entity Search', url: 'https://egov.maryland.gov/BusinessExpress/EntitySearch' },
  { name: 'Massachusetts Business Entity Search', url: 'https://corp.sec.state.ma.us/corpweb/CorpSearch/CorpSearch.aspx' },
  { name: 'Michigan Business Entity Search', url: 'https://mibusinessregistry.lara.state.mi.us/search/business' },
  { name: 'Minnesota Search Business Filings', url: 'https://mblsportal.sos.state.mn.us/Business/Search' },
  { name: 'Mississippi Business Search', url: 'https://corp.sos.ms.gov/corp/portal/c/page/corpBusinessIdSearch/portal.aspx?#clear=1' },
  { name: 'Missouri Business Entity Search', url: 'https://bsd.sos.mo.gov/BusinessEntity/BESearch.aspx?SearchType=0' },
  { name: 'Montana Business Entities Search', url: 'https://biz.sosmt.gov/search/business' },
  { name: 'Nebraska Corporation and Business Search', url: 'https://www.nebraska.gov/sos/corp/corpsearch.cgi?nav=search' },
  { name: 'Nevada Business Search', url: 'https://esos.nv.gov/EntitySearch/OnlineEntitySearch' },
  { name: 'New Hampshire QuickStart Business Search', url: 'https://quickstart.sos.nh.gov/online/BusinessInquire' },
  { name: 'New Jersey Business Entity Name Search', url: 'https://www.njportal.com/DOR/BusinessNameSearch/Search/BusinessName' },
  { name: 'New Mexico Business Search', url: 'https://enterprise.sos.nm.gov/search/business' },
  { name: 'New York Corporation & Business Entity Database', url: 'https://apps.dos.ny.gov/publicInquiry/' },
  { name: 'North Carolina Corporate Name Search', url: 'https://www.sosnc.gov/online_services/search/by_title/_Business_Registration' },
  { name: 'North Dakota Business Search', url: 'https://firststop.sos.nd.gov/search/business' },
  { name: 'Ohio Business Search', url: 'https://businesssearch.ohiosos.gov/' },
  { name: 'Oklahoma Search Corporation Entities', url: 'https://www.sos.ok.gov/corp/corpinquiryfind.aspx' },
  { name: 'Oregon Business Name Search', url: 'http://egov.sos.state.or.us/br/pkg_web_name_srch_inq.login' },
  { name: 'Pennsylvania Business Entity Search', url: 'https://file.dos.pa.gov/search/business' },
  { name: 'Rhode Island Corporate Database', url: 'http://business.sos.ri.gov/CorpWeb/CorpSearch/CorpSearch.aspx' },
  { name: 'South Carolina Business Name Search', url: 'https://businessfilings.sc.gov/BusinessFiling/Entity/Search' },
  { name: 'South Dakota Business Information Search', url: 'https://sosenterprise.sd.gov/BusinessServices/Business/FilingSearch.aspx' },
  { name: 'Tennessee Business Information Search', url: 'https://tncab.tnsos.gov/business-entity-search' },
  { name: 'Texas Taxable Entity Search', url: 'https://mycpa.cpa.state.tx.us/coa/' },
  { name: 'Utah Business Name Search', url: 'https://businessregistration.utah.gov/EntitySearch/OnlineEntitySearch' },
  { name: 'Vermont Business Search', url: 'https://bizfilings.vermont.gov/online/BusinessInquire/' },
  { name: 'Virginia Business Entity Search', url: 'https://cis.scc.virginia.gov/EntitySearch/Index' },
  { name: 'Washington Corporations Search', url: 'https://ccfs.sos.wa.gov/#/AdvancedSearch' },
  { name: 'West Virginia Business Entity Search', url: 'https://apps.wv.gov/SOS/BusinessEntitySearch/' },
  { name: 'Wisconsin Search Corporate Records', url: 'https://apps.dfi.wi.gov/apps/corpsearch/search.aspx' },
  { name: 'Wyoming Business Entity Search', url: 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx' },
];

export default function EntitiesPage() {
  const third = Math.ceil(LINKS.length / 3);
  const cols = [
    LINKS.slice(0, third),
    LINKS.slice(third, third * 2),
    LINKS.slice(third * 2),
  ];

  return (
    <>
      <Header title="Business Entity Search" />

      <div className="mx-auto max-w-[1200px] space-y-6 pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cols.map((col, i) => (
            <ul key={i} className="space-y-1.5">
              {col.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
                    <span>{link.name}</span>
                    {link.note && (
                      <span className="text-xs italic text-[var(--text-muted)]">
                        ({link.note})
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="flex justify-center pb-6">
          <a
            href="https://www.ncsc.org/information-and-resources/state-court-websites"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-3 text-base font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
          >
            <Scale className="h-5 w-5" />
            US Courts Search
          </a>
        </div>
      </div>
    </>
  );
}
